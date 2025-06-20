import { CustomError } from "../middlewares/error_middlewares.js";
import { PrismaService } from "../services/prisma_service.js";

export class ConnectionDatasource {
  static readonly followUser = async (
    followerId: string,
    followeeId: string
  ): Promise<void> => {
    try {
      await PrismaService.client.connection.create({
        data: {
          followerId,
          followeeId,
        },
      });
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
    await PrismaService.client.connection.delete({
      where: {
        followerId_followeeId: {
          followerId,
          followeeId,
        },
      },
    });
  };
}
