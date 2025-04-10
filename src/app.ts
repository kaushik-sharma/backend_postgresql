import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";

import MongoDbService from "./services/mongodb_service.js";
import authRouter from "./routes/auth_routes.js";
import profileRouter from "./routes/profile_routes.js";
import postRouter from "./routes/post_routes.js";
import moderationRouter from "./routes/moderation_routes.js";
import { defaultRateLimiter } from "./helpers/rate_limiters.js";
import { errorHandler } from "./middlewares/error_middlewares.js";
import SocketManager from "./socket.js";
import logger from "./utils/logger.js";
import { Env } from "./constants/enums.js";
import CronService from "./services/cron_service.js";

const env = Env.fromString(process.env.ENV);

dotenv.config({ path: env.filePath });

const app = express();

app.use(helmet());

app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(defaultRateLimiter);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/moderation", moderationRouter);

app.use(errorHandler);

mongoose.set("debug", true);

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "\nReason:", reason);
});
process.on("uncaughtException", (error, origin) => {
  logger.error("Uncaught Exception:", error, "\nOrigin:", origin);
});

MongoDbService.connect()
  .then(() => {
    const port = Number(process.env.PORT!);
    const host = "0.0.0.0";
    const server = app.listen(port, host, () => {
      logger.info(`Server running at https://${host}:${port}/`);
    });
    SocketManager.init(server);
    CronService.scheduleDailyEmails();
    CronService.scheduleRequestedUserDeletions();
  })
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });
