import { Router } from "express";

import {
  createPost,
  createReaction,
  createComment,
  getCommentsByPostId,
  getUserPosts,
  getUserComments,
  deletePost,
  deleteComment,
  getPostsFeed,
  validateCreatePostRequest,
  validateCreateReactionRequest,
  validateCreateCommentRequest,
} from "../controllers/post_controller.js";
import { AuthMode, requireAuth } from "../middlewares/auth_middlewares.js";
import { createSingleImageUploadMiddleware } from "../middlewares/file_upload_middlewares.js";

const router = Router();

router.post(
  "/",
  createSingleImageUploadMiddleware("image"),
  requireAuth(),
  validateCreatePostRequest,
  createPost
);
router.post(
  "/reactions/:postId",
  requireAuth(),
  validateCreateReactionRequest,
  createReaction
);
router.post(
  "/comments/:postId",
  requireAuth(),
  validateCreateCommentRequest,
  createComment
);
router.get(
  "/:page",
  requireAuth({ authMode: AuthMode.ALLOW_ANONYMOUS }),
  getPostsFeed
);
router.get(
  "/comments/:postId",
  requireAuth({ authMode: AuthMode.ALLOW_ANONYMOUS }),
  getCommentsByPostId
);
router.get("/user/:page", requireAuth(), getUserPosts);
router.get("/comments/user/:page", requireAuth(), getUserComments);
router.delete("/:postId", requireAuth(), deletePost);
router.delete("/comments/:commentId", requireAuth(), deleteComment);

export default router;
