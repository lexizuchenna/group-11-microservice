import { FastifyInstance } from "fastify";
import { create_user } from "../controllers/user.controller";

export const user_routes = async (server: FastifyInstance) => {
  server.post("/api/v1/users", create_user);
};
