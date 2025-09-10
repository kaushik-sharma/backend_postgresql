import { Router } from "express";

import { successResponseHandler } from "../helpers/success-handler.js";

export const getHealthCheckRouter = (): Router => {
  const router = Router();

  router.get("/", (req, res, next) => {
    successResponseHandler({
      res: res,
      status: 200,
      metadata: {
        message: "API is working.",
      },
      data: {
        uptime: `${Math.floor(process.uptime())}s`,
        timestamp: new Date().toISOString(),
      },
    });
  });

  return router;
};
