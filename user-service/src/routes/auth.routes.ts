import { FastifyInstance } from "fastify";
import { login_user } from "../controllers/auth.controller";

export const auth_routes = async (server: FastifyInstance) => {
  server.post("/api/v1/auth/login", login_user);
};
