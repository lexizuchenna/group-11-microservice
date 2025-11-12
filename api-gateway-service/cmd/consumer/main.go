package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/streadway/amqp"
)

// ====================================================
// STRUCTS
// ====================================================

type Notification struct {
	Type       string                 `json:"type"`
	TemplateID string                 `json:"template_id"`
	Recipient  map[string]interface{} `json:"recipient"`
	Variables  map[string]interface{} `json:"variables"`
}

// ====================================================
// GLOBALS
// ====================================================

var (
	ctx         = context.Background()
	pgPool      *pgxpool.Pool
	rabbitConn  *amqp.Connection
	rabbitCh    *amqp.Channel
	redisClient *redis.Client

	emailQueue = "email_notifications"
	pushQueue  = "push_notifications"
)

// ====================================================
// MAIN ENTRY
// ====================================================

func main() {
	_ = godotenv.Load()

	initPostgres()
	initRedis()
	initRabbitMQ()

	// Start consuming
	go consumeQueue(emailQueue, handleEmailNotification)
	go consumeQueue(pushQueue, handlePushNotification)

	log.Println("📨 Notification Consumer Service running and listening to queues...")
	select {} // block forever
}

// ====================================================
// INITIALIZERS
// ====================================================

func initPostgres() {
	connStr := os.Getenv("PG_URL")
	if connStr == "" {
		log.Fatal("PG_URL not set in .env")
	}

	var err error
	pgPool, err = pgxpool.New(ctx, connStr)
	if err != nil {
		log.Fatalf("❌ Failed to connect to Postgres: %v", err)
	}
	if err := pgPool.Ping(ctx); err != nil {
		log.Fatalf("❌ Failed to ping Postgres: %v", err)
	}
	log.Println("✅ Connected to Supabase PostgreSQL (pgx/v5)")
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
		log.Fatalf("❌ Failed to connect to Redis: %v", err)
	}
	log.Println("✅ Connected to Redis")
}

func initRabbitMQ() {
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		log.Fatal("RABBITMQ_URL not set in .env")
	}

	for {
		conn, err := amqp.Dial(rabbitURL)
		if err != nil {
			log.Printf("⚠️ RabbitMQ connect failed: %v — retrying in 10s...", err)
			time.Sleep(10 * time.Second)
			continue
		}

		ch, err := conn.Channel()
		if err != nil {
			log.Printf("⚠️ RabbitMQ channel failed: %v — retrying in 10s...", err)
			_ = conn.Close()
			time.Sleep(10 * time.Second)
			continue
		}

		// Declare queues
		for _, q := range []string{emailQueue, pushQueue} {
			_, err = ch.QueueDeclare(q, true, false, false, false, nil)
			if err != nil {
				log.Printf("⚠️ Failed to declare queue %s: %v", q, err)
			}
		}

		rabbitConn = conn
		rabbitCh = ch

		log.Println("✅ Connected to RabbitMQ and queues declared")

		// Watch for connection closure
		go func() {
			closeErr := <-rabbitConn.NotifyClose(make(chan *amqp.Error))
			if closeErr != nil {
				log.Printf("⚠️ RabbitMQ connection closed: %v — reconnecting...", closeErr)
				initRabbitMQ() // reconnect recursively
			}
		}()

		break
	}
}

// ====================================================
// CONSUME QUEUES
// ====================================================

func consumeQueue(queueName string, handler func(Notification) error) {
	for {
		if rabbitCh == nil {
			time.Sleep(5 * time.Second)
			continue
		}

		msgs, err := rabbitCh.Consume(
			queueName,
			"",
			true,  // auto-ack
			false, // not exclusive
			false,
			false,
			nil,
		)
		if err != nil {
			log.Printf("❌ Failed to start consuming %s: %v — retrying in 10s...", queueName, err)
			time.Sleep(10 * time.Second)
			continue
		}

		for msg := range msgs {
			var notif Notification
			if err := json.Unmarshal(msg.Body, &notif); err != nil {
				log.Printf("⚠️ Invalid message on %s: %v", queueName, err)
				continue
			}

			lockKey := fmt.Sprintf("notif_lock:%s:%s", notif.Type, notif.TemplateID)
			if !acquireLock(lockKey) {
				log.Printf("⚠️ Duplicate detected, skipping: %s", lockKey)
				continue
			}

			log.Printf("📩 Received %s notification", notif.Type)

			if err := handler(notif); err != nil {
				log.Printf("❌ Failed to process %s notification: %v", notif.Type, err)
			} else {
				log.Printf("✅ Processed %s notification successfully", notif.Type)
			}

			releaseLock(lockKey)
		}
	}
}

// ====================================================
// REDIS LOCK HELPERS
// ====================================================

func acquireLock(key string) bool {
	ok, err := redisClient.SetNX(ctx, key, "1", 5*time.Minute).Result()
	if err != nil {
		log.Printf("⚠️ Redis lock error: %v", err)
		return false
	}
	return ok
}

func releaseLock(key string) {
	_ = redisClient.Del(ctx, key).Err()
}

// ====================================================
// HANDLERS
// ====================================================

func handleEmailNotification(n Notification) error {
	time.Sleep(2 * time.Second) // simulate delay
	log.Printf("📧 Sending email to: %v", n.Recipient)
	success := true

	id := findNotificationID(n)
	if id == uuid.Nil {
		return fmt.Errorf("notification not found for update")
	}

	if success {
		updateNotificationStatus(id, "sent")
	} else {
		updateNotificationStatus(id, "failed")
	}
	return nil
}

func handlePushNotification(n Notification) error {
	time.Sleep(2 * time.Second)
	log.Printf("📲 Sending push to: %v", n.Recipient)
	success := true

	id := findNotificationID(n)
	if id == uuid.Nil {
		return fmt.Errorf("notification not found for update")
	}

	if success {
		updateNotificationStatus(id, "sent")
	} else {
		updateNotificationStatus(id, "failed")
	}
	return nil
}

// ====================================================
// DB HELPERS
// ====================================================

func findNotificationID(n Notification) uuid.UUID {
	var id uuid.UUID
	query := `SELECT id FROM notifications WHERE template_id=$1 AND type=$2 ORDER BY created_at DESC LIMIT 1`
	err := pgPool.QueryRow(ctx, query, n.TemplateID, n.Type).Scan(&id)
	if err != nil {
		log.Printf("⚠️ Could not find notification in DB: %v", err)
		return uuid.Nil
	}
	return id
}

func updateNotificationStatus(id uuid.UUID, status string) {
	query := `UPDATE notifications SET status=$1, updated_at=NOW() WHERE id=$2`
	_, err := pgPool.Exec(ctx, query, status, id)
	if err != nil {
		log.Printf("❌ Failed to update notification status: %v", err)
	} else {
		log.Printf("🔁 Notification %s → %s", id.String(), status)
	}
}
