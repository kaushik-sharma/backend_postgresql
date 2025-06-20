import { Router } from "express";

import { createSingleImageUploadMiddleware } from "../middlewares/file_upload_middlewares.js";
import { requireAuth } from "../middlewares/auth_middlewares.js";
import { PostController } from "../controllers/post_controller.js";
import { AuthMode } from "../constants/enums.js";

export const getPostRouter = (): Router => {
  const router = Router();

  router.post(
    "/",
    createSingleImageUploadMiddleware({ fieldName: "image" }),
    requireAuth(),
    PostController.validateCreatePostRequest,
    PostController.createPost
  );
  router.get(
    "/",
    requireAuth({ authMode: AuthMode.ALLOW_ANONYMOUS }),
    PostController.getPostsFeed
  );

  router.post(
    "/:postId/comments",
    requireAuth(),
    PostController.validateCreateCommentRequest,
    PostController.createComment
  );
  router.get(
    "/:postId/comments",
    requireAuth({ authMode: AuthMode.ALLOW_ANONYMOUS }),
    PostController.getCommentsByPostId
  );

  router.post(
    "/:postId/reactions",
    requireAuth(),
    PostController.validateCreateReactionRequest,
    PostController.createReaction
  );

  return router;
};
