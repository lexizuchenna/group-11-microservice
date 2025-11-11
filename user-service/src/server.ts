import fastify from "fastify";
import dotenv from "dotenv";
import { user_routes } from "./routes/user.routes";

dotenv.config();

const server = fastify();

server.register(user_routes);

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
