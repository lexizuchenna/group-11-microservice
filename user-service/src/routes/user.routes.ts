import { FastifyInstance } from "fastify";
import {
  find_user,
  update_user_preference,
} from "../controllers/user.controller";

export const user_routes = async (server: FastifyInstance) => {
  server.get("/", { preHandler: server.authenticate }, find_user);
  server.post(
    "/update_preference",
    { preHandler: server.authenticate },
    update_user_preference
  );
};
