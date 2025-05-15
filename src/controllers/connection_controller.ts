import { RequestHandler } from "express";

import { asyncHandler } from "../helpers/async_handler.js";
import { ConnectionDatasource } from "../datasources/connection_datasource.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import { successResponseHandler } from "../helpers/success_handler.js";
import { UserDatasource } from "../datasources/user_datasource.js";

export class ConnectionController {
  static readonly followUser: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;
      const followeeId = req.params.followeeId;

      if (userId === followeeId) {
        throw new CustomError(403, "Denied: Cannot follow yourself!");
      }

      const followeeExists = await UserDatasource.isUserActive(followeeId);
      if (!followeeExists) {
        throw new CustomError(404, "Followee not found!");
      }

      await ConnectionDatasource.followUser(userId, followeeId);

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );

  static readonly unfollowUser: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;
      const followeeId = req.params.followeeId;

      if (userId === followeeId) {
        throw new CustomError(403, "Denied: Cannot unfollow yourself!");
      }

      const followeeExists = await UserDatasource.isUserActive(followeeId);
      if (!followeeExists) {
        throw new CustomError(404, "Followee not found!");
      }

      await ConnectionDatasource.unfollowUser(userId, followeeId);

      successResponseHandler({
        res: res,
        status: 204,
      });
    }
  );
}
