export const register_schema = {
  tags: ["Auth"],
  summary: "Register a new user",
  body: {
    type: "object",
    required: ["name", "email", "password"],
    properties: {
      name: { type: "string", example: "Alexander" },
      email: { type: "string", format: "email", example: "mail@gmail.com" },
      password: { type: "string", example: "123456" },
    },
  },
  response: {
    201: {
      description: "User successfully created",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        data: {
          type: "object",
          properties: {
            user_id: {
              type: "string",
              example: "cd672647-5924-4b7b-8e1e-57f5b624426c",
            },
            name: { type: "string", example: "Alexander" },
            email: { type: "string", example: "mail@gmail.com" },
            push_token: { type: "string", nullable: true, example: null },
            preferences: {
              type: "object",
              properties: {
                push: { type: "boolean", example: false },
                email: { type: "boolean", example: true },
              },
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2025-11-11T18:45:42.261Z",
            },
          },
        },
        message: { type: "string", example: "User successfully created" },
        meta: { $ref: "meta_schema#" },
      },
    },
    409: {
      description: "Duplicate email",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        error: { type: "string", example: "Duplicate data" },
        message: {
          type: "string",
          example: "User already exists with the provided email",
        },
        meta: { $ref: "meta_schema#" },
      },
    },
  },
};

export const login_schema = {
  tags: ["Auth"],
  summary: "Login user and retrieve JWT token",
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: {
        type: "string",
        format: "email",
        example: "user@example.com",
      },
      password: { type: "string", example: "123456" },
    },
  },
  response: {
    200: {
      description: "Successful login",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        data: {
          type: "object",
          properties: {
            user_id: {
              type: "string",
              example: "bc8815d2-66e7-4054-850e-2464dfd447d8",
            },
            name: { type: "string", example: "Alexander" },
            email: { type: "string", example: "lexizuchenna@gmail.com" },
            push_token: { type: "string", example: "zzzzzz" },
            preferences: {
              type: "object",
              properties: {
                push: { type: "boolean", example: true },
                email: { type: "boolean", example: true },
              },
            },
            token: { type: "string", example: "eyJhbGciOi..." },
          },
        },
        message: {
          type: "string",
          example: "User successfully logged in",
        },
        meta: { $ref: "meta_schema#" },
      },
    },
  },
};
