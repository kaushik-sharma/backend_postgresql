import { Router } from "express";

import { requireAuth } from "../middlewares/auth_middlewares.js";
import ProfileController from "../controllers/profile_controller.js";
import { createSingleImageUploadMiddleware } from "../middlewares/file_upload_middlewares.js";

const getProfileRouter = (): Router => {
  const router = Router();

  router.get(
    "/user/:userId",
    requireAuth(),
    ProfileController.getPublicProfile
  );
  router.get("/user", requireAuth(), ProfileController.getUser);
  router.patch(
    "/updateProfile",
    createSingleImageUploadMiddleware({ fieldName: "profileImage" }),
    requireAuth(),
    ProfileController.validateUpdateProfileRequest,
    ProfileController.updateProfile
  );
  router.delete(
    "/deleteProfileImage",
    requireAuth(),
    ProfileController.deleteProfileImage
  );
  router.get(
    "/activeSessions",
    requireAuth(),
    ProfileController.getActiveSessions
  );
  router.post(
    "/signOut/:sessionId",
    requireAuth(),
    ProfileController.signOutBySessionId
  );
  router.post("/signOut", requireAuth(), ProfileController.signOut);
  router.post(
    "/signOutAllSessions",
    requireAuth(),
    ProfileController.signOutAllSessions
  );
  router.delete(
    "/requestAccountDeletion",
    requireAuth(),
    ProfileController.requestAccountDeletion
  );

  return router;
};

export default getProfileRouter;
