import { Transaction } from "sequelize";

import {
  SessionAttributes,
  SessionModel,
} from "../models/session/session_model.js";
import RedisService from "../services/redis_service.js";

export default class SessionDatasource {
  static readonly signOutSession = async (
    userId: string,
    sessionId: string
  ): Promise<void> => {
    await RedisService.client.del(`sessions:${sessionId}`);

    await SessionModel.destroy({
      where: {
        id: sessionId,
        userId: userId,
      },
    });
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

    await SessionModel.destroy({
      where: { userId: userId },
      transaction: transaction,
    });
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
