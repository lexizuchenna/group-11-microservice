export const meta_schema = {
  $id: "meta_schema",
  type: "object",
  properties: {
    total: { type: "number", example: 1 },
    limit: { type: "number", example: 0 },
    page: { type: "number", example: 0 },
    total_pages: { type: "number", example: 0 },
    has_next: { type: "boolean", example: false },
    has_previous: { type: "boolean", example: false },
  },
};
