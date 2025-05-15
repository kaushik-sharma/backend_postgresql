import rateLimit from "express-rate-limit";

import { Constants } from "../constants/values.js";
import { RedisService } from "../services/redis_service.js";

export const getDefaultRateLimiter = () =>
  rateLimit({
    windowMs: Constants.defaultRateLimiterWindowMs,
    max: Constants.defaultRateLimiterMax,
    standardHeaders: true,
    legacyHeaders: false,
    store: RedisService.hitCountStore(),
    handler: (req, res) => {
      res.status(429).json({
        message: "Too many requests, please try again later.",
      });
    },
  });

export const getRequestEmailCodeRateLimiter = () =>
  rateLimit({
    windowMs: Constants.requestEmailCodeRateLimiterWindowMs,
    max: Constants.requestEmailCodeRateLimiterMax,
    standardHeaders: true,
    legacyHeaders: false,
    store: RedisService.hitCountStore(),
    handler: (req, res) => {
      res.status(429).json({
        message: "Too many requests, please try again later.",
      });
    },
  });

export const getModerationRateLimiter = () =>
  rateLimit({
    windowMs: Constants.moderationRateLimiterWindowMs,
    max: Constants.moderationRateLimiterMax,
    standardHeaders: true,
    legacyHeaders: false,
    store: RedisService.hitCountStore(),
    keyGenerator: (req, res) => req.user!.userId,
    handler: (req, res) => {
      res.status(429).json({
        message: "Too many requests, please try again later.",
      });
    },
  });
