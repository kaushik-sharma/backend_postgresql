import http from "http";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { $enum } from "ts-enum-util";

import PostgresService from "./services/postgres_service.js";
import getAuthRouter from "./routes/auth_routes.js";
import getProfileRouter from "./routes/profile_routes.js";
import getPostRouter from "./routes/post_routes.js";
import getModerationRouter from "./routes/moderation_routes.js";
import { getDefaultRateLimiter } from "./helpers/rate_limiters.js";
import { errorHandler } from "./middlewares/error_middlewares.js";
import SocketManager from "./socket.js";
import logger from "./utils/logger.js";
import { Env } from "./constants/enums.js";
import { ENV, initEnv } from "./constants/values.js";
import CronService from "./services/cron_service.js";
import { initModels } from "./models/index.js";
import RedisService from "./services/redis_service.js";
import { hitCounter } from "./middlewares/hit_counter_middleware.js";
import getConnectionRouter from "./routes/connection_routes.js";

initEnv($enum(Env).asValueOrThrow(process.env.ENV!));

dotenv.config({ path: `.env.${ENV.toLowerCase()}` });

await PostgresService.connect();
initModels();

await RedisService.initClient();

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

app.use(hitCounter);

app.use(getDefaultRateLimiter());

app.use("/api/v1/auth", getAuthRouter());
app.use("/api/v1/profile", getProfileRouter());
app.use("/api/v1/posts", getPostRouter());
app.use("/api/v1/moderation", getModerationRouter());
app.use("/api/v1/connections", getConnectionRouter());

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
CronService.init();

const port = Number(process.env.PORT!);
const host = "0.0.0.0";

server.listen(port, host, () => {
  logger.info(`Server running at http://${host}:${port}/`);
});
