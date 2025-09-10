import { Router } from "express";

import { requireAuth } from "../middlewares/auth-middlewares.js";
import { getModerationRateLimiter } from "../middlewares/rate-limiter-middlewares.js";
import { ModerationController } from "../controllers/moderation-controller.js";

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
