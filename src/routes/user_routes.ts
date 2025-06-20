import { Router } from "express";

import { requireAuth } from "../middlewares/auth_middlewares.js";
import { UserController } from "../controllers/user_controller.js";
import { createSingleImageUploadMiddleware } from "../middlewares/file_upload_middlewares.js";
import { PostController } from "../controllers/post_controller.js";

export const getUserRouter = (): Router => {
  const router = Router();

  router.get(
    "/profile/:userId",
    requireAuth(),
    UserController.getPublicProfile
  );
  router.get("/profile", requireAuth(), UserController.getUser);
  router.patch(
    "/profile",
    createSingleImageUploadMiddleware({ fieldName: "profileImage" }),
    requireAuth(),
    UserController.validateUpdateProfileRequest,
    UserController.updateProfile
  );
  router.delete(
    "/profile/image",
    requireAuth(),
    UserController.deleteProfileImage
  );
  router.delete(
    "/profile",
    requireAuth(),
    UserController.requestAccountDeletion
  );

  router.get(
    "/sessions/active",
    requireAuth(),
    UserController.getActiveSessions
  );
  router.delete(
    "/sessions/current",
    requireAuth(),
    UserController.signOutCurrentSession
  );
  router.delete(
    "/sessions/:sessionId",
    requireAuth(),
    UserController.signOutBySessionId
  );
  router.delete("/sessions", requireAuth(), UserController.signOutAllSessions);

  router.get("/posts", requireAuth(), PostController.getUserPosts);
  router.delete("/posts/:postId", requireAuth(), PostController.deletePost);
  router.get("/comments", requireAuth(), PostController.getUserComments);
  router.delete(
    "/comments/:commentId",
    requireAuth(),
    PostController.deleteComment
  );

  return router;
};
