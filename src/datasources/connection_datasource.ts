import { CustomError } from "../middlewares/error_middlewares.js";
import { ConnectionModel } from "../models/connections/connections_model.js";

export class ConnectionDatasource {
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
}
