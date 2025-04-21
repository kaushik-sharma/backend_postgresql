import { Op, Transaction } from "sequelize";
import { EntityStatus } from "../constants/enums.js";
import { UserAttributes, UserModel } from "../models/user/user_model.js";
import { UserDeletionRequestModel } from "../models/profile/user_deletion_request_model.js";

export default class ProfileDatasource {
  static readonly getUserById = async (
    userId: string
  ): Promise<UserAttributes> => {
    const user = await UserModel.findByPk(userId);
    return user!.toJSON();
  };

  static readonly getPublicUserById = async (
    userId: string
  ): Promise<UserAttributes> => {
    const user = await UserModel.findByPk(userId, {
      attributes: ["firstName", "lastName", "profileImagePath"],
    });
    return user!.toJSON();
  };

  static readonly deleteUser = async (
    userId: string,
    transaction: Transaction
  ): Promise<void> => {
    await UserModel.update(
      {
        status: EntityStatus.deleted,
        deletedAt: new Date(),
      },
      {
        where: { id: userId },
        transaction: transaction,
      }
    );
  };

  static readonly updateProfile = async (
    userId: string,
    updatedFields: Record<string, any>
  ): Promise<void> => {
    await UserModel.update(
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
    await UserModel.update(
      {
        profileImagePath: null,
      },
      { where: { id: userId, status: EntityStatus.active } }
    );
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
    await UserDeletionRequestModel.destroy({
      where: { userId: userId },
      transaction: transaction,
    });
  };
}
