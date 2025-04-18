import { Op, Transaction } from "sequelize";

import { UserModel } from "../models/auth/user_model.js";
import { EntityStatus } from "../constants/enums.js";
import { SessionModel } from "../models/session/session_model.js";

export default class AuthDatasource {
  static readonly isUserActive = async (userId: string): Promise<boolean> => {
    const count = await UserModel.count({
      where: { id: userId, status: EntityStatus.active },
    });
    if (count > 1) {
      throw new Error("Multiple active users found!");
    }
    return count === 1;
  };

  static readonly getUserStatus = async (id: string): Promise<EntityStatus> => {
    const user = await UserModel.findByPk(id, {
      attributes: ["status"],
      raw: true,
    });
    return user!.status;
  };

  static readonly findUserByPhoneNumber = async (
    countryCode: string,
    phoneNumber: string
  ): Promise<UserModel | null> => {
    const result = await UserModel.findAll({
      where: {
        countryCode: countryCode,
        phoneNumber: phoneNumber,
        status: {
          [Op.ne]: EntityStatus.deleted,
        },
      },
    });

    if (result.length === 0) return null;

    if (result.length > 1) {
      throw new Error(
        "Multiple active users with the given phone number found!"
      );
    }

    return result[0];
  };

  static readonly findUserByEmail = async (
    email: string
  ): Promise<UserModel | null> => {
    const result = await UserModel.findAll({
      where: {
        email: email,
        status: {
          [Op.ne]: EntityStatus.deleted,
        },
      },
    });

    if (result.length === 0) return null;

    if (result.length > 1) {
      throw new Error("Multiple active users with the given email found!");
    }

    return result[0];
  };

  static readonly canSignUpWithEmail = async (
    email: string
  ): Promise<boolean> => {
    const user = await this.findUserByEmail(email);
    return user === null;
  };

  static readonly canSignUpWithPhoneNumber = async (
    countryCode: string,
    phoneNumber: string
  ): Promise<boolean> => {
    const user = await this.findUserByPhoneNumber(countryCode, phoneNumber);
    return user === null;
  };

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

  static readonly deleteAnonymousUser = async (
    userId: string,
    transaction: Transaction
  ): Promise<void> => {
    await UserModel.destroy({
      where: { id: userId, status: EntityStatus.anonymous },
      transaction: transaction,
    });
  };

  static readonly createUser = async (
    user: UserModel,
    transaction: Transaction
  ): Promise<string> => {
    const createdUser = await user.save({ transaction: transaction });
    return createdUser.id;
  };

  static readonly markUserForDeletion = async (
    userId: string,
    transaction: Transaction
  ) => {
    await UserModel.update(
      {
        status: EntityStatus.scheduledDeletion,
      },
      {
        where: {
          id: userId,
          status: EntityStatus.active,
        },
        transaction: transaction,
      }
    );
  };
}
