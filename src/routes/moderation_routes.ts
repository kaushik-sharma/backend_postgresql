import { Router } from "express";

import { requireAuth } from "../middlewares/auth_middlewares.js";
import { moderationRateLimiter } from "../helpers/rate_limiters.js";
import ModerationController from "../controllers/moderation_controller.js";

const router = Router();

router.post(
  "/post/:postId",
  requireAuth(),
  moderationRateLimiter,
  ModerationController.validateReportRequest,
  ModerationController.reportPost
);
router.post(
  "/comment/:commentId",
  requireAuth(),
  moderationRateLimiter,
  ModerationController.validateReportRequest,
  ModerationController.reportComment
);
router.post(
  "/user/:reportedUserId",
  requireAuth(),
  moderationRateLimiter,
  ModerationController.validateReportRequest,
  ModerationController.reportUser
);

export default router;
