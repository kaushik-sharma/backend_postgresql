import {
  cast,
  FindAttributeOptions,
  literal,
  Op,
  Transaction,
} from "sequelize";

import { EntityStatus } from "../constants/enums.js";
import {
  UserDeletionRequestAttributes,
  UserDeletionRequestModel,
} from "../models/user/user_deletion_request_model.js";
import { UserModel, UserAttributes } from "../models/user/user_model.js";
import { CustomError } from "../middlewares/error_middlewares.js";

export class UserDatasource {
  static readonly isUserActive = async (userId: string): Promise<boolean> => {
    const count = await UserModel.count({
      where: { id: userId, status: EntityStatus.active },
    });
    if (count > 1) {
      throw new Error("Multiple active users found!");
    }
    return count === 1;
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

    return user?.toJSON() ?? null;
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

    return count > 0;
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

    return count > 0;
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
    return count > 0;
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
    userId: string,
    fields: string[],
    currentUserId?: string
  ): Promise<UserAttributes | null> => {
    const attributes: FindAttributeOptions = [
      ...fields,
      [
        cast(
          literal(`(
            SELECT COUNT(*)
            FROM "connections" AS c
            JOIN "users" AS u
              ON u."id" = c."followerId"
            WHERE
              c."followeeId" = "UserModel"."id"
              AND u."status" = '${EntityStatus.active}'
          )`),
          "integer"
        ),
        "followerCount",
      ],
      [
        cast(
          literal(`(
            SELECT COUNT(*)
            FROM "connections" AS c
            JOIN "users" AS u
              ON u."id" = c."followeeId"
            WHERE
              c."followerId" = "UserModel"."id"
              AND u."status" = '${EntityStatus.active}'
          )`),
          "integer"
        ),
        "followeeCount",
      ],
    ];

    if (currentUserId) {
      attributes.push([
        literal(`
          EXISTS(
            SELECT 1
            FROM "connections" AS c
            WHERE
              c."followerId" = '${currentUserId}'
              AND c."followeeId" = "UserModel"."id"
          )
        `),
        "isFollowee",
      ]);
    }

    const user = await UserModel.findOne({
      where: {
        id: userId,
        status: EntityStatus.active,
      },
      attributes: attributes,
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
    updatedFields: Record<string, any>,
    transaction: Transaction
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
        transaction,
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

  static readonly deleteProfileImage = async (
    userId: string,
    transaction?: Transaction
  ) => {
    const result = await UserModel.update(
      {
        profileImagePath: null,
      },
      {
        where: {
          id: userId,
          status: {
            [Op.in]: [EntityStatus.active, EntityStatus.requestedDeletion],
          },
        },
        transaction,
      }
    );
    if (result[0] === 0) {
      throw new CustomError(404, "User not found!");
    }
  };

  static readonly createUserDeletionRequest = async (
    data: UserDeletionRequestAttributes,
    transaction: Transaction
  ): Promise<void> => {
    await UserDeletionRequestModel.create(data, { transaction });
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
    transaction: Transaction
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

  static readonly setUserActive = async (
    userId: string,
    transaction: Transaction
  ) => {
    const result = await UserModel.update(
      {
        status: EntityStatus.active,
      },
      {
        where: { id: userId },
        transaction,
      }
    );

    if (result[0] === 0) {
      throw new CustomError(404, "User not found!");
    }
  };
}
