import { Transaction } from "sequelize";

import { SessionModel } from "../models/session/session_model.js";

export default class SessionDatasource {
  static readonly signOutSession = async (
    userId: string,
    sessionId: string
  ): Promise<void> => {
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
    await SessionModel.destroy({
      where: { userId: userId },
      transaction: transaction,
    });
  };
}
