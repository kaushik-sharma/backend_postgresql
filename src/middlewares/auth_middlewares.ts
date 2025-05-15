import { RequestHandler } from "express";

import { JwtService } from "../services/jwt_service.js";
import { AuthMode } from "../constants/enums.js";

export const requireAuth = ({
  authMode = AuthMode.authenticated,
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
      authMode: AuthMode.anonymousOnly,
    });
  }
  next();
};
