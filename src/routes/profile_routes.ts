import { Router } from "express";

import { requireAuth } from "../middlewares/auth_middlewares.js";
import ProfileController from "../controllers/profile_controller.js";
import { createSingleImageUploadMiddleware } from "../middlewares/file_upload_middlewares.js";

const getProfileRouter = (): Router => {
  const router = Router();

  router.get(
    "/profile/:userId",
    requireAuth(),
    ProfileController.getPublicProfile
  );
  router.get("/profile", requireAuth(), ProfileController.getUser);
  router.patch(
    "/profile",
    createSingleImageUploadMiddleware({ fieldName: "profileImage" }),
    requireAuth(),
    ProfileController.validateUpdateProfileRequest,
    ProfileController.updateProfile
  );
  router.delete(
    "/profile/image",
    requireAuth(),
    ProfileController.deleteProfileImage
  );
  router.delete(
    "/profile",
    requireAuth(),
    ProfileController.requestAccountDeletion
  );

  router.get(
    "/sessions/active",
    requireAuth(),
    ProfileController.getActiveSessions
  );
  router.delete(
    "/sessions/current",
    requireAuth(),
    ProfileController.signOutCurrentSession
  );
  router.delete(
    "/sessions/:sessionId",
    requireAuth(),
    ProfileController.signOutBySessionId
  );
  router.delete(
    "/sessions",
    requireAuth(),
    ProfileController.signOutAllSessions
  );

  router.get("/posts", requireAuth(), ProfileController.getUserPosts);
  router.delete("/posts/:postId", requireAuth(), ProfileController.deletePost);
  router.get("/comments", requireAuth(), ProfileController.getUserComments);
  router.delete(
    "/comments/:commentId",
    requireAuth(),
    ProfileController.deleteComment
  );

  return router;
};

export default getProfileRouter;
