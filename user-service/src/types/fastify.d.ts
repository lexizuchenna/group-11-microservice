import "fastify";
import { JWT } from "@fastify/jwt";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      user_id: string;
    };
    jwt: JWT;
  }

  interface FastifyInstance {
    authenticate: any;
  }
}
