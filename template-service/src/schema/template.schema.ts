export const create_template_schema = {
  tags: ["Template"],
  summary: "Create a new reusable notification template",
  description: "Creates a template that supports variable substitution and versioning.",
  body: {
    type: "object",
    required: ["name", "content", "variables"],
    properties: {
      name: { type: "string", example: "welcome_email" },
      content: {
        type: "string",
        example: "Hello {{name}}, welcome! Click this link: {{link}}",
      },
      variables: {
        type: "array",
        items: { type: "string" },
        example: ["name", "link"],
      },
      description: { type: "string", example: "Welcome email for new users" },
      language: { type: "string", example: "en" },
    },
  },

  response: {
    201: {
      description: "Template created successfully",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        data: {
          type: "object",
          properties: {
            id: { type: "string", example: "ab3e4a82-1d89-4b9e-a82a-11c39b610e10" },
            name: { type: "string", example: "welcome_email" },
            version: { type: "number", example: 1 },
            language: { type: "string", example: "en" },
            description: { type: "string", example: "Welcome email for new users" },
            content: {
              type: "string",
              example: "Hello {{name}}, welcome! Click this link: {{link}}",
            },
            variables: {
              type: "array",
              items: { type: "string" },
              example: ["name", "link"],
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2025-11-11T06:26:48.860Z",
            },
          },
        },
        message: { type: "string", example: "Template created successfully" },
        meta: { $ref: "meta_schema#" },
      },
    },

    400: {
      description: "Bad request",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        error: { type: "string", example: "Template already exists" },
        message: { type: "string", example: "Duplicate template name found" },
        meta: { $ref: "meta_schema#" },
      },
    },

    500: {
      description: "Internal server error",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        error: { type: "string", example: "Internal server error, try again" },
        message: { type: "string", example: "Something went wrong in the server" },
        meta: { $ref: "meta_schema#" },
      },
    },
  },
};
