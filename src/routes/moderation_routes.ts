import { Router } from "express";
import {
  reportComment,
  reportPost,
  reportUser,
  validateReportCommentRequest,
  validateReportPostRequest,
  validateReportUserRequest,
} from "../controllers/moderation_controller.js";
import { requireAuth } from "../middlewares/auth_middlewares.js";
import { moderationRateLimiter } from "../helpers/rate_limiters.js";

const router = Router();

router.post(
  "/posts/:postId",
  requireAuth(),
  moderationRateLimiter,
  validateReportPostRequest,
  reportPost
);
router.post(
  "/comments/:commentId",
  requireAuth(),
  moderationRateLimiter,
  validateReportCommentRequest,
  reportComment
);
router.post(
  "/users",
  requireAuth(),
  moderationRateLimiter,
  validateReportUserRequest,
  reportUser
);

export default router;
