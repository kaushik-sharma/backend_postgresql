import { Router } from "express";

import { AuthController } from "../controllers/auth_controller.js";
import { requireAuth, optionalAuth } from "../middlewares/auth_middlewares.js";
import { AuthMode } from "../constants/enums.js";
import { getRequestEmailCodeRateLimiter } from "../middlewares/rate_limiter_middlewares.js";

export const getAuthRouter = (): Router => {
  const router = Router();

  router.get(
    "/email/status/:email",
    AuthController.validateEmailRequest,
    AuthController.checkEmailStatus
  );
  router.post(
    "/email/send-code",
    getRequestEmailCodeRateLimiter(),
    AuthController.validateEmailCodeRequest,
    AuthController.sendEmailCode
  );
  router.post(
    "/signup",
    optionalAuth,
    AuthController.validateSignUpRequest,
    AuthController.signUp
  );
  router.post(
    "/signin",
    optionalAuth,
    AuthController.validateSignInRequest,
    AuthController.signIn
  );
  router.post(
    "/anonymous",
    AuthController.validateAnonymousAuthRequest,
    AuthController.anonymousAuth
  );
  router.post(
    "/token/refresh",
    requireAuth({ authMode: AuthMode.ALLOW_ANONYMOUS }),
    AuthController.refreshAuthToken
  );

  return router;
};
