import http from "http";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { $enum } from "ts-enum-util";

import { PrismaService } from "./services/prisma_service.js";
import { getAuthRouter } from "./routes/auth_routes.js";
import { getUserRouter } from "./routes/user_routes.js";
import { getPostRouter } from "./routes/post_routes.js";
import { getModerationRouter } from "./routes/moderation_routes.js";
import { getConnectionRouter } from "./routes/connection_routes.js";
import { getCronRouter } from "./routes/cron_router.js";
import { getDefaultRateLimiter } from "./middlewares/rate_limiter_middlewares.js";
import { errorHandler } from "./middlewares/error_middlewares.js";
import { SocketManager } from "./socket.js";
import logger from "./utils/logger.js";
import { Env } from "./constants/enums.js";
import { Constants } from "./constants/values.js";
import { RedisService } from "./services/redis_service.js";
import { hitCounter } from "./middlewares/hit_counter_middleware.js";
import { getHealthCheckRouter } from "./routes/health_check_routes.js";
// import { KafkaService } from "./services/kafka_service.js";

Constants.env = $enum(Env).asValueOrThrow(process.env.ENV!);

dotenv.config({ path: `.env.${Constants.env.toLowerCase()}` });

await PrismaService.connect();
await RedisService.initClient();

// await KafkaService.setupProducers();
// await KafkaService.setupConsumers();

const app = express();

app.use(helmet());

app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(express.json({ limit: "100kb" }));

app.use(hitCounter());

app.use(getDefaultRateLimiter());

app.use("/api/health", getHealthCheckRouter());

app.use("/api/v1/auth", getAuthRouter());
app.use("/api/v1/user", getUserRouter());
app.use("/api/v1/posts", getPostRouter());
app.use("/api/v1/moderation", getModerationRouter());
app.use("/api/v1/connections", getConnectionRouter());
app.use("/api/v1/cron", getCronRouter());

app.use(errorHandler);

process.on("unhandledRejection", (reason, promise) => {
  console.error(reason);
});
process.on("uncaughtException", (error, origin) => {
  console.error(error);
  console.error(origin);
});

const server = http.createServer(
  {
    maxHeaderSize: 8192,
  },
  app
);

SocketManager.init(server);

server.listen(3000, "0.0.0.0", () => {
  logger.info("Server running at http://localhost:3000/");
});
