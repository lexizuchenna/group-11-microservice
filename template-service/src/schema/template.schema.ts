export const create_template_schema = {
  tags: ["Template"],
  summary: "Create a new reusable notification template",
  description:
    "Creates a template that supports variable substitution and versioning.",
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
            id: {
              type: "string",
              example: "ab3e4a82-1d89-4b9e-a82a-11c39b610e10",
            },
            name: { type: "string", example: "welcome_email" },
            version: { type: "number", example: 1 },
            language: { type: "string", example: "en" },
            description: {
              type: "string",
              example: "Welcome email for new users",
            },
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
        message: {
          type: "string",
          example: "Something went wrong in the server",
        },
        meta: { $ref: "meta_schema#" },
      },
    },
  },
};

export const get_templates_schema = {
  tags: ["Template"],
  summary: "Fetch all templates",
  description:
    "Returns a list of all templates including id, name, version, variables, language and timestamps.",
  response: {
    200: {
      description: "Templates successfully retrieved",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                example: "e8d3f4c0-9b34-4d19-a34c-771eb88b5e90",
              },
              name: { type: "string", example: "welcome_email" },
              description: {
                type: "string",
                example: "Template for welcome messages",
              },
              version: { type: "number", example: 1 },
              language: { type: "string", example: "html" },
              variables: {
                type: "array",
                items: { type: "string" },
                example: ["user_name", "app_name", "login_url"],
              },
              created_at: {
                type: "string",
                format: "date-time",
                example: "2025-11-11T06:26:48.860Z",
              },
              updated_at: {
                type: "string",
                format: "date-time",
                example: "2025-11-11T06:26:48.860Z",
              },
            },
          },
        },
        message: {
          type: "string",
          example: "Templates retrieved successfully",
        },
        meta: { $ref: "meta_schema#" },
      },
    },
    500: {
      description: "Internal server error",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        error: { type: "string", example: "Server error" },
        message: { type: "string", example: "Something went wrong" },
        meta: { $ref: "meta_schema#" },
      },
    },
  },
};

export const render_template_schema = {
  tags: ["Template"],
  summary: "Render a template with dynamic variables",
  description:
    "Renders a template by name and fills all placeholders with provided variables. Throws an error if required variables are missing.",
  body: {
    type: "object",
    required: ["name", "variables"],
    properties: {
      name: { type: "string", example: "welcome_email" },
      version: { type: "number", example: 2 },
      variables: {
        type: "object",
        example: {
          user_name: "Lexis",
          app_name: "HNG Notify",
          login_url: "https://example.com/login",
        },
      },
    },
  },
  response: {
    200: {
      description: "Template rendered successfully",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        data: {
          type: "object",
          properties: {
            rendered: {
              type: "string",
              example:
                "<h1>Welcome Lexis!</h1><p>Login at https://example.com/login</p>",
            },
          },
        },
        message: { type: "string", example: "Template rendered successfully" },
        meta: { $ref: "meta_schema#" },
      },
    },
    400: {
      description: "Missing or invalid variables",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        error: {
          type: "string",
          example: "Missing variables: app_name, login_url",
        },
        message: { type: "string", example: "Invalid variable set provided" },
        meta: { $ref: "meta_schema#" },
      },
    },
    404: {
      description: "Template not found",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        error: { type: "string", example: "Template not found" },
        message: {
          type: "string",
          example: "No template exists with that name",
        },
        meta: { $ref: "meta_schema#" },
      },
    },
  },
};
