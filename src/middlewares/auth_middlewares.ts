import { RequestHandler } from "express";

import JwtService from "../services/jwt_service.js";
import { AuthMode } from "../constants/enums.js";

export const requireAuth = ({
  authMode = AuthMode.AUTHENTICATED,
}: { authMode?: AuthMode } = {}): RequestHandler => {
  return async (req, res, next) => {
    const token = req.headers["authorization"] as string;
    const [userId, sessionId] = await JwtService.verifyAuthToken(token, {
      authMode: authMode,
    });
    req.user = { userId: userId, sessionId: sessionId };
    next();
  };
};

export const optionalAuth: RequestHandler = async (req, res, next) => {
  const token = req.headers["authorization"] as string | undefined;
  if (token !== undefined) {
    const [anonymousUserId, sessionId] = await JwtService.verifyAuthToken(
      token,
      {
        authMode: AuthMode.ANONYMOUS_ONLY,
      }
    );
    req.user = { userId: anonymousUserId, sessionId: sessionId };
  }
  next();
};
