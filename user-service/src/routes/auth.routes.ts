import { FastifyInstance } from "fastify";
import { create_user, login_user } from "../controllers/auth.controller";
import { login_schema, register_schema } from "../schema/auth.schema";

export const auth_routes = async (server: FastifyInstance) => {
  server.post("/login", { schema: login_schema }, login_user);
  server.post("/register", { schema: register_schema }, create_user);
};
