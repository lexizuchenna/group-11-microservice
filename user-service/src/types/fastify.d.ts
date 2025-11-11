import "fastify";
import { JWT } from "@fastify/jwt";

declare module "fastify" {
  interface FastifyRequest {
    user?: User;
    jwt: JWT;
  }

  interface FastifyInstance {
    authenticate: any;
  }
}

type User = {
  user_id: string;
  email: string;
  name: string;
  push_token: string | null;
  preferences: JsonValue;
  password: string;
  created_at: Date;
};
