import { FastifyInstance } from "fastify";
import {
  create_template,
  get_templates,
  render_template,
} from "../controllers/template.controller";
import {
  create_template_schema,
  get_templates_schema,
  render_template_schema,
} from "../schema/template.schema";

export const template_routes = async (server: FastifyInstance) => {
  server.post("/create", { schema: create_template_schema }, create_template);
  server.get("/all", { schema: get_templates_schema }, get_templates);
  server.post(
    "/template_render",
    { schema: render_template_schema },
    render_template
  );
};
