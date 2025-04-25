import { Router } from "express";

import { requireAuth } from "../middlewares/auth_middlewares.js";
import { getModerationRateLimiter } from "../helpers/rate_limiters.js";
import ModerationController from "../controllers/moderation_controller.js";

const getModerationRouter = (): Router => {
  const router = Router();

  router.post(
    "/post/:postId",
    requireAuth(),
    getModerationRateLimiter(),
    ModerationController.validateReportRequest,
    ModerationController.reportPost
  );
  router.post(
    "/comment/:commentId",
    requireAuth(),
    getModerationRateLimiter(),
    ModerationController.validateReportRequest,
    ModerationController.reportComment
  );
  router.post(
    "/user/:reportedUserId",
    requireAuth(),
    getModerationRateLimiter(),
    ModerationController.validateReportRequest,
    ModerationController.reportUser
  );

  return router;
};

export default getModerationRouter;
