import fastify, { FastifyRequest, FastifyReply } from "fastify";
import dotenv from "dotenv";
import jwt from "@fastify/jwt";

import { user_routes } from "./routes/user.routes";
import { auth_routes } from "./routes/auth.routes";
import { prisma } from "./plugins/db";
import { UUID } from "crypto";

dotenv.config();

const server = fastify();

server.register(jwt, {
  secret: process.env.JWT_SECRET || "keyboard_dog",
  sign: {
    expiresIn: "7d",
  },
});

server.addHook("preHandler", (request, reply, next) => {
  request.jwt = server.jwt;
  return next();
});

server.decorate(
  "authenticate",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer"))
        return reply.status(401).send({
          success: false,
          error: "Invalid Token",
          message: "Authentication token not found",
          meta: {
            total: 0,
            limit: 0,
            page: 0,
            total_pages: 0,
            has_next: false,
            has_previous: false,
          },
        });

      const token = authHeader.split(" ")[1];

      if (!token)
        return reply.status(401).send({
          success: false,
          error: "Invalid Token",
          message: "Authentication token not found",
          meta: {
            total: 0,
            limit: 0,
            page: 0,
            total_pages: 0,
            has_next: false,
            has_previous: false,
          },
        });

      const decoded = request.jwt.verify(token) as {
        user_id: UUID;
        iat: number;
        exp: number;
      };

      const user = await prisma.user.findUnique({
        where: { user_id: decoded.user_id },
      });

      if (!user)
        return reply.status(400).send({
          success: false,
          error: "Invalid user",
          message: "The user with the specified user_id is not found",
          meta: {
            total: 0,
            limit: 0,
            page: 0,
            total_pages: 0,
            has_next: false,
            has_previous: false,
          },
        });

      request.user = user;
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        return reply.status(401).send({
          success: false,
          error: "Token Expired",
          message: "Authentication token has expired",
          meta: {
            total: 0,
            limit: 0,
            page: 0,
            total_pages: 0,
            has_next: false,
            has_previous: false,
          },
        });
      }
      if (err.name === "JsonWebTokenError") {
        return reply.status(401).send({
          success: false,
          error: "Invalid Token",
          message: "Invalid authentication token",
          meta: {
            total: 0,
            limit: 0,
            page: 0,
            total_pages: 0,
            has_next: false,
            has_previous: false,
          },
        });
      }

      return reply.status(401).send({
        success: false,
        error: "Unauthorized",
        message: "Authentication failed",
        meta: {
          total: 0,
          limit: 0,
          page: 0,
          total_pages: 0,
          has_next: false,
          has_previous: false,
        },
      });
    }
  }
);

server.register(auth_routes);
server.register(user_routes, { prefix: "/api/v1/user" });

server.get("/health", async (request, reply) => {
  try {
    return {
      status: "ok",
      service: "user_service",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(error);
    return {
      status: "",
      service: "user_service",
      timestamp: new Date().toISOString(),
    };
  }
});

server.listen(
  { port: Number(process.env.PORT) || 3000, host: "0.0.0.0" },
  (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log(`Server listening on ${address}`);
  }
);
