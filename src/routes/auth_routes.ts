import { Router } from "express";
import {
  signUp,
  signIn,
  checkPhoneNumber,
  signOut,
  signOutAllSessions,
  refreshAuthToken,
  anonymousAuth,
  validatePhoneNumberRequest,
  validateSignUpRequest,
  validateSignInRequest,
} from "../controllers/auth_controller.js";
import {
  requireAuth,
  optionalAuth,
  AuthMode,
} from "../middlewares/auth_middlewares.js";

const router = Router();

router.get("/checkPhoneNumber", validatePhoneNumberRequest, checkPhoneNumber);
router.post("/signUp", optionalAuth, validateSignUpRequest, signUp);
router.post("/signIn", optionalAuth, validateSignInRequest, signIn);
router.post("/anonymous", anonymousAuth);
router.post("/signOut", requireAuth(), signOut);
router.post("/signOutAllSessions", requireAuth(), signOutAllSessions);
router.get(
  "/refreshAuthToken",
  requireAuth({ authMode: AuthMode.ALLOW_ANONYMOUS }),
  refreshAuthToken
);

export default router;
