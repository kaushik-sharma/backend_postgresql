import http from "http";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import PostgresService from "./services/postgres_service.js";
import authRouter from "./routes/auth_routes.js";
import profileRouter from "./routes/profile_routes.js";
import postRouter from "./routes/post_routes.js";
import moderationRouter from "./routes/moderation_routes.js";
import { defaultRateLimiter } from "./helpers/rate_limiters.js";
import { errorHandler } from "./middlewares/error_middlewares.js";
import SocketManager from "./socket.js";
import logger from "./utils/logger.js";
import { Env } from "./constants/enums.js";
import { ENV, initEnv, initSequelize } from "./constants/values.js";
import CronService from "./services/cron_service.js";
import { initModels } from "./models/index.js";

initEnv(Env.fromString(process.env.ENV!));

dotenv.config({ path: ENV.filePath });

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

app.use(defaultRateLimiter);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/moderation", moderationRouter);

app.use(errorHandler);

process.on("unhandledRejection", (reason, promise) => {
  console.error(reason);
});
process.on("uncaughtException", (error, origin) => {
  console.error(error);
  console.error(origin);
});

try {
  const sequelize = await PostgresService.connect();
  initSequelize(sequelize);
  initModels();

  const port = Number(process.env.PORT!);
  const host = "0.0.0.0";

  const server = http.createServer(
    {
      maxHeaderSize: 8192,
    },
    app
  );
  server.listen(port, host, () => {
    logger.info(`Server running at https://${host}:${port}/`);
  });

  SocketManager.init(server);
  CronService.scheduleDailyEmails();
  CronService.scheduleRequestedUserDeletions();
} catch (err: any) {
  console.error(err);
  process.exit(1);
}
