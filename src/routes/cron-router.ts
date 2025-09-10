import { Router } from "express";

import { authenticateCronRequest } from "../middlewares/auth-middlewares.js";
import { CronController } from "../controllers/cron-controller.js";

export const getCronRouter = (): Router => {
  const router = Router();

  router.delete(
    "/delete-scheduled-users",
    authenticateCronRequest,
    CronController.deleteScheduledUsers
  );
  router.post(
    "/moderation-checkup",
    authenticateCronRequest,
    CronController.moderationCheckup
  );

  return router;
};
