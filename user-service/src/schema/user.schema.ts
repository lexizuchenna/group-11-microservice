export const find_user_schema = {
  tags: ["User"],
  summary: "Retrieve authenticated user details",
  description:
    "This endpoint requires a Bearer token in the Authorization header: `Authorization: Bearer <token>`",
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: "Authenticated user retrieved successfully",
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
            created_at: {
              type: "string",
              format: "date-time",
              example: "2025-11-11T06:26:48.860Z",
            },
          },
        },
        message: { type: "string", example: "User successfully retried" },
        meta: { $ref: "meta_schema#" },
      },
    },
    401: {
      description: "Unauthorized or invalid token",
      oneOf: [
        {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Invalid Token" },
            message: {
              type: "string",
              example: "Authentication token not found",
            },
            meta: { $ref: "meta_schema#" },
          },
        },
        {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Unauthorized" },
            message: { type: "string", example: "Authentication failed" },
            meta: { $ref: "meta_schema#" },
          },
        },
      ],
    },
  },
};

export const update_preference_schema = {
  tags: ["User"],
  summary: "Update user notification preferences",
  description:
    "This endpoint requires a Bearer token in the Authorization header: `Authorization: Bearer <token>`",
  security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    properties: {
      preferences: {
        type: "object",
        properties: {
          email: { type: "boolean", example: true },
          push: { type: "boolean", example: true },
        },
      },
      push_token: { type: "string", example: "zzzzzz" },
    },
  },
  response: {
    200: {
      description: "Preferences updated successfully",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        data: {
          type: "object",
          properties: {
            preferences: {
              type: "object",
              properties: {
                email: { type: "boolean", example: true },
                push: { type: "boolean", example: true },
              },
            },
            push_token: { type: "string", example: "zzzzzz" },
          },
        },
        message: {
          type: "string",
          example: "User preference successfully updated",
        },
        meta: { $ref: "meta_schema#" },
      },
    },
    401: {
      description: "Unauthorized or invalid token",
      oneOf: [
        {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Invalid Token" },
            message: {
              type: "string",
              example: "Authentication token not found",
            },
            meta: { $ref: "meta_schema#" },
          },
        },
        {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Unauthorized" },
            message: { type: "string", example: "Authentication failed" },
            meta: { $ref: "meta_schema#" },
          },
        },
      ],
    },
  },
};
