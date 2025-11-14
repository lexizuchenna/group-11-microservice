import fastify from "fastify";
import dotenv from "dotenv";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

import { meta_schema } from "./schema/shared.schema";
import { template_routes } from "./routes/template.routes";

dotenv.config();

const server = fastify({
  ajv: {
    customOptions: {
      strict: false,
    },
  },
});

server.addSchema(meta_schema);

server.register(swagger, {
  openapi: {
    openapi: "3.0.0",
    info: {
      title: "Tenplate Service API",
      version: "0.1.0",
    },
    // components: {
    //   securitySchemes: {
    //     bearerAuth: {
    //       type: "http",
    //       scheme: "bearer",
    //       bearerFormat: "JWT",
    //     },
    //   },
    // },
    // security: [
    //   {
    //     bearerAuth: [],
    //   },
    // ],
  },
});

server.register(swaggerUi, {
  routePrefix: "/docs",
});

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

server.register(template_routes, { prefix: "/api/v1/template" });

server.get("/health", async (request, reply) => {
  try {
    return reply.status(200).send({
      status: "ok",
      service: "template_service",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    return {
      status: "",
      service: "template_service",
      timestamp: new Date().toISOString(),
    };
  }
});

server.swagger;

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
