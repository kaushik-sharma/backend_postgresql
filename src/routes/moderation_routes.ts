import { Router } from "express";

import { requireAuth } from "../middlewares/auth_middlewares.js";
import { getModerationRateLimiter } from "../middlewares/rate_limiter_middlewares.js";
import { ModerationController } from "../controllers/moderation_controller.js";

export const getModerationRouter = (): Router => {
  const router = Router();

  router.post(
    "/reports",
    requireAuth(),
    getModerationRateLimiter(),
    ModerationController.validateReportRequest,
    ModerationController.createReport
  );

  return router;
};
