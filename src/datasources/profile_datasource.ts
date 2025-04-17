import { Op, Transaction } from "sequelize";
import { EntityStatus } from "../constants/enums.js";
import { UserModel } from "../models/auth/user_model.js";
import { UserDeletionRequestModel } from "../models/profile/user_deletion_request_model.js";

export default class ProfileDatasource {
  static readonly getUserById = async (userId: string): Promise<UserModel> => {
    return (await UserModel.findByPk(userId, { raw: true }))!;
  };

  static readonly getPublicUserById = async (
    userId: string
  ): Promise<UserModel> => {
    return (await UserModel.findByPk(userId, {
      attributes: ["firstName", "lastName", "profileImagePath"],
      raw: true,
    }))!;
  };

  static readonly deleteAccount = async (
    userId: string,
    transaction: Transaction
  ): Promise<void> => {
    // TODO: Implement
    throw new Error("Unimplemented error.");
    // await UserModel.update(
    //   {
    //     status: EntityStatus.deleted,
    //     profileImagePath: null,
    //   },
    //   {
    //     where: {
    //       id: userId,
    //       status: EntityStatus.active,
    //     },
    //     transaction: transaction,
    //   }
    // );
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
    const result = await UserModel.findByPk(userId, {
      attributes: ["profileImagePath"],
      raw: true,
    });
    const profileImagePath = result!.profileImagePath;
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

  static readonly userDeletionRequestExists = async (
    userId: string
  ): Promise<boolean> => {
    const count = await UserDeletionRequestModel.count({
      where: { userId: userId },
    });
    return count > 0;
  };

  static readonly createUserDeletionRequest = async (
    model: UserDeletionRequestModel,
    transaction: Transaction
  ): Promise<void> => {
    const result = await model.save({ transaction: transaction });
  };

  static readonly cancelUserDeletionRequest = async (
    userId: string
  ): Promise<void> => {
    await UserDeletionRequestModel.destroy({
      where: { userId: userId },
    });
  };

  static readonly getDueUserDeletions = async (): Promise<
    UserDeletionRequestModel[]
  > => {
    return await UserDeletionRequestModel.findAll({
      where: {
        deleteAt: {
          [Op.lte]: new Date(),
        },
      },
      raw: true,
    });
  };

  static readonly removeDeletionRequest = async (
    userId: string,
    transaction: Transaction
  ) => {
    await UserDeletionRequestModel.destroy({
      where: { userId: userId },
      transaction: transaction,
    });
  };
}
