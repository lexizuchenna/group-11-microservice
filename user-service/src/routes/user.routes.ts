import { FastifyInstance } from "fastify";
import {
  find_user,
  update_user_preference,
} from "../controllers/user.controller";
import {
  find_user_schema,
  update_preference_schema,
} from "../schema/user.schema";

export const user_routes = async (server: FastifyInstance) => {
  server.get(
    "/me",
    { preHandler: server.authenticate, schema: find_user_schema },
    find_user
  );
  server.post(
    "/update_preference",
    { preHandler: server.authenticate, schema: update_preference_schema },
    update_user_preference
  );
};
