import { RequestHandler } from "express";

import JwtService from "../services/jwt_service.js";

export enum AuthMode {
  AUTHENTICATED,
  ANONYMOUS_ONLY,
  ALLOW_ANONYMOUS,
}

export const requireAuth = ({
  authMode = AuthMode.AUTHENTICATED,
}: { authMode?: AuthMode } = {}): RequestHandler => {
  return async (req, res, next) => {
    const token = req.headers["authorization"] as string;
    const [userId, sessionId] = await JwtService.verifyJwt(token, {
      authMode: authMode,
    });
    req.user = { userId: userId, sessionId: sessionId };
    next();
  };
};

export const optionalAuth: RequestHandler = async (req, res, next) => {
  const token = req.headers["authorization"] as string | undefined;
  if (token !== undefined) {
    const [anonymousUserId, sessionId] = await JwtService.verifyJwt(token, {
      authMode: AuthMode.ANONYMOUS_ONLY,
    });
    req.user = { userId: anonymousUserId, sessionId: sessionId };
  }
  next();
};
