package models

// PushMessage represents the structure for push queue messages
// @Description Structure of messages received by the Push Queue
type PushMessage struct {
	Type     string                 `json:"type" example:"push"`
	To       string                 `json:"to" example:"device_token_abc123"`
	Title    string                 `json:"title" example:"New Message"`
	Body     string                 `json:"body" example:"You have received a new message from Sarah."`
	Priority string                 `json:"priority,omitempty" example:"high"`
	Data     map[string]interface{} `json:"data,omitempty" example:"{\"message_id\":\"msg_54321\",\"sender\":\"Sarah\"}"`
	Metadata map[string]interface{} `json:"metadata,omitempty" example:"{\"event\":\"NEW_MESSAGE\",\"timestamp\":\"2025-11-12T09:32:00Z\"}"`
}
