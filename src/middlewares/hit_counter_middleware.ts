import { Request, Response, NextFunction } from "express";
import { Duration } from "luxon";

import RedisService from "../services/redis_service.js";

export async function hitCounter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const key = `hits:${req.method}:${req.path}`;
    const count = await RedisService.client.incr(key);
    if (count === 1) {
      const expireDuration = Duration.fromObject({ days: 7 });
      await RedisService.client.expire(key, expireDuration.as("seconds"));
    }
  } catch (err) {
    console.warn("Hit counter failed:", err);
  }
  return next();
}
