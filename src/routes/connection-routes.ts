import { Router } from "express";

import { requireAuth } from "../middlewares/auth-middlewares.js";
import { ConnectionController } from "../controllers/connection-controller.js";

export const getConnectionRouter = (): Router => {
  const router = Router();

  router.post(
    "/follow/:followeeId",
    requireAuth(),
    ConnectionController.followUser
  );
  router.delete(
    "/follow/:followeeId",
    requireAuth(),
    ConnectionController.unfollowUser
  );

  return router;
};
