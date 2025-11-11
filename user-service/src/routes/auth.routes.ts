import { FastifyInstance } from "fastify";
import { create_user, login_user } from "../controllers/auth.controller";

export const auth_routes = async (server: FastifyInstance) => {
  server.post("/api/v1/auth/login", login_user);
  server.post("/api/v1/auth/register", create_user);
};
