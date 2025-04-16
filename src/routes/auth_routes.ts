import { Router } from "express";

import { AuthController } from "../controllers/auth_controller.js";
import { requireAuth, optionalAuth } from "../middlewares/auth_middlewares.js";
import { AuthMode } from "../constants/enums.js";

const router = Router();

router.get(
  "/checkPhoneNumber",
  AuthController.validatePhoneNumberRequest,
  AuthController.checkPhoneNumber
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
router.post("/anonymous", AuthController.anonymousAuth);
router.post("/signOut", requireAuth(), AuthController.signOut);
router.post(
  "/signOutAllSessions",
  requireAuth(),
  AuthController.signOutAllSessions
);
router.get(
  "/refreshAuthToken",
  requireAuth({ authMode: AuthMode.ALLOW_ANONYMOUS }),
  AuthController.refreshAuthToken
);

export default router;
