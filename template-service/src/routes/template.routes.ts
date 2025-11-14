import { FastifyInstance } from "fastify";
import { create_template } from "../controllers/template.controller";
import { create_template_schema } from "../schema/template.schema";

export const template_routes = async (server: FastifyInstance) => {
  server.post("/create", { schema: create_template_schema }, create_template);
};
