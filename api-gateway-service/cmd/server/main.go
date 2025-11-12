package main

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
	"github.com/sony/gobreaker"
	"github.com/streadway/amqp"
)

// ======================================================
// Global variables
// ======================================================
var (
	ctx = context.Background()

	rabbitConn *amqp.Connection
	rabbitCh   *amqp.Channel
	exchange   = "notifications"
	emailQueue = "email.queue"
	pushQueue  = "push.queue"
	failedQueue = "failed.queue"

	pgPool      *pgxpool.Pool
	redisClient *redis.Client

	logger = logrus.New()
	cb     *gobreaker.CircuitBreaker

	reqDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name: "api_gateway_request_duration_seconds",
		Help: "Request duration in seconds",
	}, []string{"handler", "code"})

	reqErrors = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "api_gateway_request_errors_total",
		Help: "Total API errors",
	}, []string{"handler", "error"})
)

// ======================================================
// Structs
// ======================================================
type Notification struct {
	Type       string                 `json:"type"`        // "email" or "push"
	TemplateID string                 `json:"template_id"` // optional
	Recipient  map[string]interface{} `json:"recipient"`   // email/push token
	Variables  map[string]interface{} `json:"variables"`   // template variables
}

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// ======================================================
// Main
// ======================================================
func main() {
	_ = godotenv.Load() // optional

	logger.SetFormatter(&logrus.JSONFormatter{})

	initCircuitBreaker()
	initRabbitMQ()
	initPostgres()
	initRedis()

	http.HandleFunc("/health", healthHandler)
	http.Handle("/metrics", promhttp.Handler())

	http.HandleFunc("/api/v1/notifications/send", withRequestContext(sendNotificationHandler))
	http.HandleFunc("/api/v1/users/", withRequestContext(userProxyHandler))
	http.HandleFunc("/api/v1/templates/", withRequestContext(templateProxyHandler))

	port := os.Getenv("SERVICE_PORT")
	if port == "" {
		port = "8080"
	}

	logger.Infof("🚀 API Gateway running on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

// ======================================================
// Initializers
// ======================================================
func initRabbitMQ() {
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		logger.Fatal("RABBITMQ_URL not set")
	}

	var err error
	for {
		rabbitConn, err = amqp.Dial(rabbitURL)
		if err != nil {
			logger.Warnf("🐇 RabbitMQ connect failed: %v, retrying 10s...", err)
			time.Sleep(10 * time.Second)
			continue
		}

		rabbitCh, err = rabbitConn.Channel()
		if err != nil {
			logger.Warnf("🐇 RabbitMQ channel failed: %v, retrying 10s...", err)
			_ = rabbitConn.Close()
			time.Sleep(10 * time.Second)
			continue
		}

		// declare exchange
		if err := rabbitCh.ExchangeDeclare(exchange, "direct", true, false, false, false, nil); err != nil {
			logger.Warnf("🐇 Exchange declare failed: %v, retrying 10s...", err)
			time.Sleep(10 * time.Second)
			continue
		}

		// declare queues
		for _, q := range []string{emailQueue, pushQueue, failedQueue} {
			_, err = rabbitCh.QueueDeclare(q, true, false, false, false, nil)
			if err != nil {
				logger.Warnf("🐇 Queue declare failed %s: %v, retrying 10s...", q, err)
				time.Sleep(10 * time.Second)
				continue
			}
		}

		// bind queues to exchange
		rabbitCh.QueueBind(emailQueue, emailQueue, exchange, false, nil)
		rabbitCh.QueueBind(pushQueue, pushQueue, exchange, false, nil)
		rabbitCh.QueueBind(failedQueue, failedQueue, exchange, false, nil)

		logger.Info("✅ RabbitMQ connected, exchange and queues declared")

		// Monitor connection closure asynchronously
		go func() {
			closeErr := <-rabbitConn.NotifyClose(make(chan *amqp.Error))
			if closeErr != nil {
				logger.Warnf("⚠️ RabbitMQ connection closed: %v, reconnecting...", closeErr)
				initRabbitMQ()
			}
		}()

		break
	}
}

func initPostgres() {
	connStr := os.Getenv("PG_URL")
	if connStr == "" {
		logger.Fatal("PG_URL not set")
	}

	var err error
	pgPool, err = pgxpool.New(ctx, connStr)
	if err != nil {
		logger.Fatalf("Failed to connect to Postgres: %v", err)
	}

	if err := pgPool.Ping(ctx); err != nil {
		logger.Fatalf("Failed to ping Postgres: %v", err)
	}

	logger.Info("✅ Connected to PostgreSQL")
}

func initRedis() {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		addr = "localhost:6379"
	}
	redisClient = redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})
	if err := redisClient.Ping(ctx).Err(); err != nil {
		logger.Fatalf("Failed to connect to Redis: %v", err)
	}
	logger.Info("✅ Redis connected")
}

func initCircuitBreaker() {
	settings := gobreaker.Settings{
		Name:        "external_service_cb",
		MaxRequests: 5,
		Interval:    60 * time.Second,
		Timeout:     30 * time.Second,
		ReadyToTrip: func(c gobreaker.Counts) bool {
			return c.ConsecutiveFailures > 5
		},
	}
	cb = gobreaker.NewCircuitBreaker(settings)
}

// ======================================================
// Middleware / Context
// ======================================================
type ctxKey string

const (
	ctxRequestIDKey ctxKey = "requestID"
)

func withRequestContext(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		if reqID == "" {
			reqID = uuid.New().String()
		}
		w.Header().Set("X-Request-ID", reqID)

		entry := logger.WithFields(logrus.Fields{
			"request_id":  reqID,
			"remote_addr": r.RemoteAddr,
		})

		start := time.Now()
		next(w, r.WithContext(context.WithValue(r.Context(), ctxRequestIDKey, reqID)))
		duration := time.Since(start).Seconds()
		reqDuration.WithLabelValues(r.URL.Path, "200").Observe(duration)
		entry.WithField("duration_s", duration).Infof("%s %s", r.Method, r.URL.Path)
	}
}

func logWithCtx(r *http.Request) *logrus.Entry {
	reqID, _ := r.Context().Value(ctxRequestIDKey).(string)
	return logger.WithField("request_id", reqID)
}

// ======================================================
// Helpers
// ======================================================
func respondJSON(w http.ResponseWriter, status int, success bool, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(APIResponse{Success: success, Message: message, Data: data})
}

func publishWithRetry(rq Notification, queue string) error {
	jsonData, _ := json.Marshal(rq)
	var retry int
	for {
		err := rabbitCh.Publish(exchange, queue, false, false, amqp.Publishing{
			ContentType:  "application/json",
			Body:         jsonData,
			DeliveryMode: amqp.Persistent,
			Timestamp:    time.Now(),
			Headers:      amqp.Table{"request_id": uuid.New().String()},
		})
		if err == nil {
			return nil
		}
		retry++
		if retry > 5 {
			return err
		}
		time.Sleep(time.Duration(retry*2) * time.Second) // exponential backoff
	}
}

func isDuplicateRequest(requestID string) bool {
	if requestID == "" {
		return false
	}
	key := "idempotency:" + requestID
	exists, _ := redisClient.Exists(ctx, key).Result()
	return exists > 0
}

func markRequestDone(requestID string) {
	if requestID == "" {
		return
	}
	key := "idempotency:" + requestID
	_ = redisClient.Set(ctx, key, "done", 24*time.Hour).Err()
}

// storeNotificationInDB inserts a row into notifications
func storeNotificationInDB(id uuid.UUID, requestID string, notif Notification, status string) error {
	q := `INSERT INTO notifications (id, request_id, type, template_id, recipient, variables, status, created_at, updated_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())`
	recipientJSON, _ := json.Marshal(notif.Recipient)
	variablesJSON, _ := json.Marshal(notif.Variables)
	_, err := pgPool.Exec(ctx, q, id, requestID, notif.Type, notif.TemplateID, recipientJSON, variablesJSON, status)
	return err
}

func updateNotificationStatusInDB(id uuid.UUID, status string) error {
	q := `UPDATE notifications SET status=$1, updated_at=NOW() WHERE id=$2`
	_, err := pgPool.Exec(ctx, q, status, id)
	return err
}

// ======================================================
// Handlers
// ======================================================
func healthHandler(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, true, "API Gateway healthy", nil)
}

func sendNotificationHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondJSON(w, http.StatusMethodNotAllowed, false, "Method not allowed", nil)
		return
	}

	entry := logWithCtx(r)
	var notif Notification
	if err := json.NewDecoder(r.Body).Decode(&notif); err != nil {
		reqErrors.WithLabelValues("sendNotification", "bad_request").Inc()
		entry.Error("Invalid request body: ", err)
		respondJSON(w, http.StatusBadRequest, false, "Invalid request", nil)
		return
	}

	requestID := r.Header.Get("X-Request-ID")
	if requestID == "" {
		requestID = uuid.New().String()
	}

	if isDuplicateRequest(requestID) {
		entry.Info("Duplicate request detected: ", requestID)
		respondJSON(w, http.StatusOK, true, "Duplicate request ignored", nil)
		return
	}

	notifID := uuid.New()
	if err := storeNotificationInDB(notifID, requestID, notif, "queued"); err != nil {
		entry.Error("failed to store notification in db: ", err)
	}

	var queue string
	switch notif.Type {
	case "email":
		queue = emailQueue
	case "push":
		queue = pushQueue
	default:
		updateNotificationStatusInDB(notifID, "failed")
		respondJSON(w, http.StatusBadRequest, false, "Invalid notification type", nil)
		return
	}

	if err := publishWithRetry(notif, queue); err != nil {
		entry.Error("Failed to publish to queue: ", err)
		updateNotificationStatusInDB(notifID, "failed")
		reqErrors.WithLabelValues("sendNotification", "queue_publish").Inc()
		respondJSON(w, http.StatusInternalServerError, false, "Failed to queue notification", nil)
		return
	}

	markRequestDone(requestID)
	updateNotificationStatusInDB(notifID, "queued")
	entry.Infof("Queued %s notification id=%s request_id=%s", notif.Type, notifID.String(), requestID)
	respondJSON(w, http.StatusOK, true, "Notification queued", map[string]string{"notification_id": notifID.String(), "request_id": requestID})
}

// ======================================================
// Proxy handlers with circuit breaker
// ======================================================
func userProxyHandler(w http.ResponseWriter, r *http.Request) {
	target := os.Getenv("USER_SERVICE_URL")
	proxyRequestWithCB(w, r, target)
}

func templateProxyHandler(w http.ResponseWriter, r *http.Request) {
	target := os.Getenv("TEMPLATE_SERVICE_URL")
	proxyRequestWithCB(w, r, target)
}

func proxyRequestWithCB(w http.ResponseWriter, r *http.Request, targetBase string) {
	bodyBytes, _ := io.ReadAll(r.Body)
	targetURL := targetBase + r.URL.Path

	doReq := func() (interface{}, error) {
		req, err := http.NewRequest(r.Method, targetURL, bytes.NewBuffer(bodyBytes))
		if err != nil {
			return nil, err
		}
		req.Header = r.Header
		client := &http.Client{Timeout: 10 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()
		respBytes, _ := io.ReadAll(resp.Body)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(resp.StatusCode)
		w.Write(respBytes)
		return resp.StatusCode, nil
	}

	if _, err := cb.Execute(doReq); err != nil {
		logWithCtx(r).Error("External call failed: ", err)
		reqErrors.WithLabelValues("proxyRequest", "external_call").Inc()
		respondJSON(w, http.StatusBadGateway, false, "Downstream service unavailable", nil)
	}
}
