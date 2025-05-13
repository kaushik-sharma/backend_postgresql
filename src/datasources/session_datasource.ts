import { Transaction } from "sequelize";

import {
  SessionAttributes,
  SessionModel,
} from "../models/session/session_model.js";
import RedisService from "../services/redis_service.js";
import { CustomError } from "../middlewares/error_middlewares.js";

export default class SessionDatasource {
  static readonly signOutSession = async (
    sessionId: string,
    userId: string
  ): Promise<void> => {
    await RedisService.client.del(`sessions:${sessionId}`);

    const count = await SessionModel.destroy({
      where: {
        id: sessionId,
        userId: userId,
      },
    });

    if (count === 0) {
      throw new CustomError(404, "Session not found!");
    }
  };

  static readonly signOutAllSessions = async (
    userId: string,
    transaction?: Transaction
  ): Promise<void> => {
    const sessions = await SessionModel.findAll({
      where: { userId: userId },
      attributes: ["id"],
    });
    const sessionIds = sessions.map((session) => session.toJSON().id!);

    for (const sessionId of sessionIds) {
      await RedisService.client.del(`sessions:${sessionId}`);
    }

    const count = await SessionModel.destroy({
      where: { userId: userId },
      transaction: transaction,
    });

    if (count === 0) {
      throw new CustomError(404, "Sessions not found!");
    }
  };

  static readonly getActiveSessions = async (
    userId: string
  ): Promise<SessionAttributes[]> => {
    const sessions = await SessionModel.findAll({
      where: { userId: userId },
      attributes: ["id", "deviceName", "platform", "createdAt"],
      order: [["createdAt", "DESC"]],
    });
    return sessions.map((session) => session.toJSON());
  };

  static readonly getUserIdFromSessionId = async (
    sessionId: string
  ): Promise<string | null> => {
    const result = await SessionModel.findByPk(sessionId, {
      attributes: ["userId"],
    });
    return result?.toJSON().userId ?? null;
  };
}
