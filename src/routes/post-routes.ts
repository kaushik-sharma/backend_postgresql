import { Router } from "express";

import { createSingleImageUploadMiddleware } from "../middlewares/file-upload-middlewares.js";
import { requireAuth } from "../middlewares/auth-middlewares.js";
import { PostController } from "../controllers/post-controller.js";

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
    requireAuth({ authMode: 'ALLOW_ANONYMOUS' }),
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
    requireAuth({ authMode: 'ALLOW_ANONYMOUS' }),
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
