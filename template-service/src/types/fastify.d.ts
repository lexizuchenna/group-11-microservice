import "fastify";
import { JWT } from "@fastify/jwt";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      user_id: string;
      email: string;
      name: string;
      push_token: string | null;
      preferences: JsonValue;
      password: string;
      created_at: Date;
    };
    jwt: JWT;
  }

  interface FastifyInstance {
    authenticate: any;
  }
}
