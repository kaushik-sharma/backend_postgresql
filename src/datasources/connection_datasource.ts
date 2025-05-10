import { CustomError } from "../middlewares/error_middlewares.js";
import { ConnectionModel } from "../models/connections/connections_model.js";

export default class ConnectionDatasource {
  static readonly followUser = async (
    followerId: string,
    followeeId: string
  ): Promise<void> => {
    try {
      const model = new ConnectionModel({
        followerId,
        followeeId,
      });
      await model.save();
    } catch (e: any) {
      if (e.name === "SequelizeUniqueConstraintError") {
        throw new CustomError(409, "Connection already exists.");
      }
      throw e;
    }
  };

  static readonly unfollowUser = async (
    followerId: string,
    followeeId: string
  ): Promise<void> => {
    const count = await ConnectionModel.destroy({
      where: { followerId, followeeId },
    });
    if (count === 0) {
      throw new CustomError(404, "Connection not found!");
    }
  };

  static readonly getFollowerCount = async (
    userId: string
  ): Promise<number> => {
    const count = await ConnectionModel.scope("withActiveFollower").count({
      where: {
        followeeId: userId,
      },
    });
    return count;
  };

  static readonly getFollowingCount = async (
    userId: string
  ): Promise<number> => {
    const count = await ConnectionModel.scope("withActiveFollowee").count({
      where: {
        followerId: userId,
      },
    });
    return count;
  };

  static readonly isFollowee = async (
    followerId: string,
    followeeId: string
  ): Promise<boolean> => {
    const count = await ConnectionModel.count({
      where: {
        followerId,
        followeeId,
      },
    });
    return count > 0;
  };
}
