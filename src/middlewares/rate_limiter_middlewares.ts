import rateLimit from "express-rate-limit";

import {
  DEFAULT_RATE_LIMITER_WINDOW_MS,
  DEFAULT_RATE_LIMITER_MAX,
  REQUEST_EMAIL_CODE_RATE_LIMITER_WINDOW_MS,
  REQUEST_EMAIL_CODE_RATE_LIMITER_MAX,
  MODERATION_RATE_LIMITER_WINDOW_MS,
  MODERATION_RATE_LIMITER_MAX,
} from "../constants/values.js";
import { RedisService } from "../services/redis_service.js";

export const getDefaultRateLimiter = () =>
  rateLimit({
    windowMs: DEFAULT_RATE_LIMITER_WINDOW_MS,
    max: DEFAULT_RATE_LIMITER_MAX,
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
    windowMs: REQUEST_EMAIL_CODE_RATE_LIMITER_WINDOW_MS,
    max: REQUEST_EMAIL_CODE_RATE_LIMITER_MAX,
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
    windowMs: MODERATION_RATE_LIMITER_WINDOW_MS,
    max: MODERATION_RATE_LIMITER_MAX,
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
