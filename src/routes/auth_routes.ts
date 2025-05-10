import { Router } from "express";

import AuthController from "../controllers/auth_controller.js";
import { requireAuth, optionalAuth } from "../middlewares/auth_middlewares.js";
import { AuthMode } from "../constants/enums.js";
import { getRequestEmailCodeRateLimiter } from "../helpers/rate_limiters.js";

const getAuthRouter = (): Router => {
  const router = Router();

  router.get(
    "/checkEmail",
    AuthController.validateEmailRequest,
    AuthController.checkEmail
  );
  router.post(
    "/requestEmailCode",
    getRequestEmailCodeRateLimiter(),
    AuthController.validateEmailCodeRequest,
    AuthController.requestEmailCode
  );
  router.post(
    "/signUp",
    optionalAuth,
    AuthController.validateSignUpRequest,
    AuthController.signUp
  );
  router.post(
    "/signIn",
    optionalAuth,
    AuthController.validateSignInRequest,
    AuthController.signIn
  );
  router.post(
    "/anonymous",
    AuthController.validateAnonymousAuthRequest,
    AuthController.anonymousAuth
  );
  router.get(
    "/refreshAuthToken",
    requireAuth({ authMode: AuthMode.allowAnonymous }),
    AuthController.refreshAuthToken
  );

  return router;
};

export default getAuthRouter;
