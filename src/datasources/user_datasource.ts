import { Op, Transaction } from "sequelize";

import { EntityStatus } from "../constants/enums.js";
import { UserDeletionRequestModel } from "../models/user/user_deletion_request_model.js";
import { UserModel, UserAttributes } from "../models/user/user_model.js";
import { CustomError } from "../middlewares/error_middlewares.js";

export default class UserDatasource {
  static readonly isUserActive = async (userId: string): Promise<boolean> => {
    const count = await UserModel.count({
      where: { id: userId, status: EntityStatus.active },
    });
    if (count > 1) {
      throw new Error("Multiple active users found!");
    }
    return count === 1;
  };

  static readonly getUserStatus = async (
    userId: string
  ): Promise<EntityStatus> => {
    const user = await UserModel.findByPk(userId, {
      attributes: ["status"],
    });
    return user!.toJSON().status;
  };

  static readonly findUserByEmail = async (
    email: string
  ): Promise<UserAttributes | null> => {
    const user = await UserModel.findOne({
      where: {
        email: email,
        status: {
          [Op.ne]: EntityStatus.deleted,
        },
      },
      attributes: ["id", "status"],
    });

    if (user === null) return null;

    return user.toJSON();
  };

  static readonly userByEmailExists = async (
    email: string
  ): Promise<boolean> => {
    const count = await UserModel.count({
      where: {
        email,
        status: {
          [Op.ne]: EntityStatus.deleted,
        },
      },
    });

    return count === 1;
  };

  static readonly userByPhoneNumberExists = async (
    countryCode: string,
    phoneNumber: string
  ): Promise<boolean> => {
    const count = await UserModel.count({
      where: {
        countryCode,
        phoneNumber,
        status: {
          [Op.ne]: EntityStatus.deleted,
        },
      },
    });

    return count === 1;
  };

  static readonly deleteAnonymousUser = async (
    userId: string,
    transaction: Transaction
  ): Promise<void> => {
    const count = await UserModel.destroy({
      where: { id: userId, status: EntityStatus.anonymous },
      transaction: transaction,
    });

    if (count === 0) {
      throw new CustomError(404, "User not found!");
    }
  };

  static readonly createUser = async (
    userData: UserAttributes,
    transaction: Transaction
  ): Promise<string> => {
    const user = new UserModel(userData);
    const createdUser = await user.save({ transaction: transaction });
    return createdUser.toJSON().id!;
  };

  static readonly anonymousUserExists = async (
    userId: string
  ): Promise<boolean> => {
    const count = await UserModel.count({
      where: {
        id: userId,
        status: EntityStatus.anonymous,
      },
    });
    return count === 1;
  };

  static readonly convertAnonymousUserToActive = async (
    anonymousUserId: string,
    userData: UserAttributes,
    transaction: Transaction
  ): Promise<string> => {
    await UserModel.update(
      {
        ...userData,
      },
      {
        where: { id: anonymousUserId, status: EntityStatus.anonymous },
        transaction: transaction,
      }
    );
    return anonymousUserId;
  };

  static readonly markUserForDeletion = async (
    userId: string,
    transaction: Transaction
  ) => {
    const result = await UserModel.update(
      {
        status: EntityStatus.requestedDeletion,
      },
      {
        where: {
          id: userId,
          status: EntityStatus.active,
        },
        transaction: transaction,
      }
    );

    if (result[0] === 0) {
      throw new CustomError(404, "User not found!");
    }
  };

  static readonly getUserById = async (
    userId: string
  ): Promise<UserAttributes> => {
    const user = await UserModel.findByPk(userId);
    return user!.toJSON();
  };

  static readonly getPublicUserById = async (
    userId: string
  ): Promise<UserAttributes | null> => {
    const user = await UserModel.findOne({
      where: {
        id: userId,
        status: EntityStatus.active,
      },
      attributes: ["firstName", "lastName", "profileImagePath"],
    });
    return user?.toJSON() ?? null;
  };

  static readonly deleteUser = async (
    userId: string,
    transaction: Transaction
  ): Promise<void> => {
    const result = await UserModel.update(
      {
        status: EntityStatus.deleted,
        deletedAt: new Date(),
      },
      {
        where: { id: userId },
        transaction: transaction,
      }
    );

    if (result[0] === 0) {
      throw new CustomError(404, "User not found!");
    }
  };

  static readonly updateProfile = async (
    userId: string,
    updatedFields: Record<string, any>
  ): Promise<void> => {
    const result = await UserModel.update(
      {
        ...updatedFields,
      },
      {
        where: {
          id: userId,
          status: EntityStatus.active,
        },
      }
    );

    if (result[0] === 0) {
      throw new CustomError(404, "User not found!");
    }
  };

  static readonly getUserProfileImagePath = async (
    userId: string
  ): Promise<string | null> => {
    const user = await UserModel.findByPk(userId, {
      attributes: ["profileImagePath"],
    });
    const profileImagePath = user!.toJSON().profileImagePath;
    if (profileImagePath === undefined) {
      throw new Error("profileImagePath does not exist.");
    }
    return profileImagePath;
  };

  static readonly resetProfileImage = async (userId: string) => {
    const result = await UserModel.update(
      {
        profileImagePath: null,
      },
      { where: { id: userId, status: EntityStatus.active } }
    );
    if (result[0] === 0) {
      throw new CustomError(404, "User not found!");
    }
  };

  static readonly createUserDeletionRequest = async (
    model: UserDeletionRequestModel,
    transaction: Transaction
  ): Promise<void> => {
    await model.save({ transaction: transaction });
  };

  static readonly getDueDeletionUserIds = async (): Promise<string[]> => {
    const result = await UserDeletionRequestModel.findAll({
      where: {
        deleteAt: {
          [Op.lte]: new Date(),
        },
      },
      attributes: ["userId"],
    });

    return result.map((data) => data.toJSON()["userId"]);
  };

  static readonly removeDeletionRequest = async (
    userId: string,
    transaction?: Transaction
  ): Promise<void> => {
    const count = await UserDeletionRequestModel.destroy({
      where: { userId: userId },
      transaction: transaction,
    });
    if (count === 0) {
      throw new CustomError(404, "Deletion request not found!");
    }
  };

  static readonly banUser = async (
    userId: string,
    transaction: Transaction
  ): Promise<void> => {
    const result = await UserModel.update(
      {
        status: EntityStatus.banned,
        bannedAt: new Date(),
      },
      {
        where: { id: userId },
        transaction: transaction,
      }
    );

    if (result[0] === 0) {
      throw new CustomError(404, "User not found!");
    }
  };
}
