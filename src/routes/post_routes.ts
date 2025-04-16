import { Router } from "express";

import { createSingleImageUploadMiddleware } from "../middlewares/file_upload_middlewares.js";
import { requireAuth } from "../middlewares/auth_middlewares.js";
import PostController from "../controllers/post_controller.js";
import { AuthMode } from "../constants/enums.js";

const router = Router();

router.post(
  "/",
  createSingleImageUploadMiddleware("image"),
  requireAuth(),
  PostController.validateCreatePostRequest,
  PostController.createPost
);
router.post(
  "/reactions/:postId",
  requireAuth(),
  PostController.validateCreateReactionRequest,
  PostController.createReaction
);
router.post(
  "/comments/:postId",
  requireAuth(),
  PostController.validateCreateCommentRequest,
  PostController.createComment
);
router.get(
  "/:page",
  requireAuth({ authMode: AuthMode.ALLOW_ANONYMOUS }),
  PostController.getPostsFeed
);
router.get(
  "/comments/:postId",
  requireAuth({ authMode: AuthMode.ALLOW_ANONYMOUS }),
  PostController.getCommentsByPostId
);
router.get("/user/:page", requireAuth(), PostController.getUserPosts);
router.get(
  "/comments/user/:page",
  requireAuth(),
  PostController.getUserComments
);
router.delete("/:postId", requireAuth(), PostController.deletePost);
router.delete(
  "/comments/:commentId",
  requireAuth(),
  PostController.deleteComment
);

export default router;
