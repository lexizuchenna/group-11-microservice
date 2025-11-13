package models

// EmailMessage represents the structure for email queue messages
// @Description Structure of messages received by the Email Queue
type EmailMessage struct {
	Type       string                 `json:"type" example:"email"`
	To         string                 `json:"to" example:"user@example.com"`
	Subject    string                 `json:"subject" example:"Welcome to Our Platform"`
	Body       string                 `json:"body" example:"Hello John, your account has been successfully created."`
	TemplateID string                 `json:"template_id,omitempty" example:"welcome_template"`
	Data       map[string]interface{} `json:"data,omitempty" example:"{\"username\":\"John\",\"activation_link\":\"https://example.com/activate\"}"`
	Metadata   map[string]interface{} `json:"metadata,omitempty" example:"{\"event\":\"USER_REGISTRATION\",\"timestamp\":\"2025-11-12T09:32:00Z\"}"`
}
