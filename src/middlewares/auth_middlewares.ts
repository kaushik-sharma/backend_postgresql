import { RequestHandler } from "express";

import { JwtService } from "../services/jwt_service.js";
import { AuthMode } from "../constants/enums.js";
import { CustomError } from "./error_middlewares.js";

export const requireAuth = ({
  authMode = AuthMode.AUTHENTICATED,
}: { authMode?: AuthMode } = {}): RequestHandler => {
  return async (req, res, next) => {
    const token = req.headers["authorization"] as string;
    req.user = await JwtService.verifyAuthToken(token, {
      authMode: authMode,
    });
    next();
  };
};

export const optionalAuth: RequestHandler = async (req, res, next) => {
  const token = req.headers["authorization"] as string | undefined;
  if (token !== undefined) {
    req.user = await JwtService.verifyAuthToken(token, {
      authMode: AuthMode.ANONYMOUS_ONLY,
    });
  }
  next();
};

export const authenticateCronRequest: RequestHandler = (req, res, next) => {
  const secret = req.headers["x-cron-secret"] as string;
  if (secret !== process.env.CRON_SECRET!) {
    throw new CustomError(401, "Unauthenticated request");
  }
  next();
};
