import { FastifyInstance } from "fastify";
import { find_user } from "../controllers/user.controller";

export const user_routes = async (server: FastifyInstance) => {
  server.get("/", { preHandler: server.authenticate }, find_user);
};
