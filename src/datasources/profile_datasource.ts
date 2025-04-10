import { UserModel } from "../models/auth/user_model.js";
import { ProfileModel, ProfileType } from "../models/profile/profile_model.js";
import { ProfileUpdateType } from "../models/profile/profile_update_model.js";
import AwsS3Service from "../services/aws_s3_service.js";
import { DEFAULT_PROFILE_IMAGE_PATH } from "../constants/values.js";
import {
  UserDeletionRequestModel,
  UserDeletionRequestType,
} from "../models/profile/user_deletion_request_model.js";
import { EntityStatus } from "../constants/enums.js";

export default class ProfileDatasource {
  static readonly getUserById = async (
    userId: string
  ): Promise<ProfileType> => {
    const user = await UserModel.findById(userId).lean();

    const profileImageUrl = AwsS3Service.getCloudfrontDownloadUrl(
      user!.profileImagePath ?? DEFAULT_PROFILE_IMAGE_PATH
    );

    const fullUser: Record<string, any> = {
      ...user,
      profileImageUrl: profileImageUrl,
    };

    return new ProfileModel(fullUser);
  };

  static readonly deleteAccount = async (userId: string): Promise<void> => {
    await UserModel.updateOne(
      {
        _id: userId,
        status: EntityStatus.active,
      },
      {
        $set: {
          status: EntityStatus.deleted,
          profileImagePath: null,
        },
      }
    );
  };

  static readonly updateProfile = async (
    userId: string,
    updatedProfile: ProfileUpdateType
  ): Promise<void> => {
    const updatedProfileData = (updatedProfile as Record<string, any>)[
      "_doc"
    ] as Record<string, any>;
    const effectiveProfileData: Record<string, any> = Object.fromEntries(
      Object.entries(updatedProfileData).filter(
        ([key, value]) => value !== null
      )
    );

    await UserModel.updateOne(
      {
        _id: userId,
        status: EntityStatus.active,
      },
      {
        $set: effectiveProfileData,
      }
    );
  };

  static readonly getUserProfileImagePath = async (
    userId: string
  ): Promise<string | null> => {
    const result = await UserModel.findOne(
      {
        _id: userId,
        status: EntityStatus.active,
      },
      {
        _id: false,
        profileImagePath: true,
      }
    ).lean();
    return (result as Record<string, any>)["profileImagePath"];
  };

  static readonly resetProfileImage = async (userId: string) => {
    await UserModel.updateOne(
      {
        _id: userId,
        status: EntityStatus.active,
      },
      {
        $set: {
          profileImagePath: null,
        },
      }
    );
  };

  static readonly userDeletionRequestExists = async (
    userId: string
  ): Promise<boolean> => {
    const result = await UserDeletionRequestModel.findOne(
      { userId: userId },
      { _id: true }
    );
    return result !== null;
  };

  static readonly createUserDeletionRequest = async (
    data: UserDeletionRequestType
  ) => {
    const model = new UserDeletionRequestModel(data);
    await model.save();
  };

  static readonly cancelUserDeletionRequest = async (
    userId: string
  ): Promise<void> => {
    await UserDeletionRequestModel.deleteOne({
      userId: userId,
    });
  };

  static readonly getDueUserDeletions = async (): Promise<
    UserDeletionRequestType[]
  > => {
    return await UserDeletionRequestModel.find({
      deleteAt: { $lte: new Date() },
    }).lean();
  };

  static readonly removeDeletionRequest = async (userId: string) => {
    await UserDeletionRequestModel.deleteOne({ userId: userId });
  };
}
