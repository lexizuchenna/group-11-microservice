package main


import (
"bytes"
"net/http/httptest"
"os"
"testing"


"github.com/gin-gonic/gin"
)


func TestEmptyPayload(t *testing.T) {
// minimal subset: start gin router with handler and send bad json
os.Setenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
os.Setenv("REDIS_ADDR", "localhost:6379")
// NOTE: this test assumes local rabbitmq/redis are not required for BindJSON error
g := gin.Default()
g.POST("/v1/notifications/send", func(c *gin.Context) {
var req map[string]interface{}
if err := c.BindJSON(&req); err != nil {
c.JSON(400, gin.H{"success": false})
return
}
c.JSON(200, gin.H{"success": true})
})


req := bytes.NewBufferString("invalid-json")
r := httptest.NewRequest("POST", "/v1/notifications/send", req)
r.Header.Set("Content-Type", "application/json")
w := httptest.NewRecorder()
g.ServeHTTP(w, r)
if w.Code != 400 {
t.Fatalf("expected 400, got %d", w.Code)
}
}