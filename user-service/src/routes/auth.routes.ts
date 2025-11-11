import { FastifyInstance } from "fastify";
import { create_user, login_user } from "../controllers/auth.controller";

export const auth_routes = async (server: FastifyInstance) => {
  server.post("/login", login_user);
  server.post("/register", create_user);
};
