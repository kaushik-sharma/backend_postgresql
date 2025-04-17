import { RequestHandler } from "express";
import { addDays } from "date-fns";

import { asyncHandler } from "../helpers/async_handler.js";
import { successResponseHandler } from "../helpers/success_handler.js";
import ProfileDatasource from "../datasources/profile_datasource.js";
import AwsS3Service, { AwsS3FileCategory } from "../services/aws_s3_service.js";
import {
  DEFAULT_PROFILE_IMAGE_PATH,
  USER_ACCOUNT_DELETION_BUFFER_TIME_IN_DAYS,
} from "../constants/values.js";
import ProfileDto from "../dtos/profile_dto.js";
import { validateModel } from "../helpers/validation_helper.js";
import {
  updateProfileSchema,
  UpdateProfileType,
} from "../validation/profile_schema.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import { UserDeletionRequestModel } from "../models/profile/user_deletion_request_model.js";
import AuthDatasource from "../datasources/auth_datasource.js";
import { performTransaction } from "../helpers/transaction_helper.js";
import PublicProfileDto from "../dtos/public_profile_dto.js";
import { EntityStatus } from "../constants/enums.js";

export const deleteCustomProfileImage = async (
  userId: string
): Promise<void> => {
  const profileImagePath = await ProfileDatasource.getUserProfileImagePath(
    userId
  );
  if (profileImagePath !== null) {
    AwsS3Service.initiateDeleteFile(profileImagePath);
  }
};

export default class ProfileController {
  static readonly getUser: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const user = await ProfileDatasource.getUserById(userId);

      const profileImageUrl = AwsS3Service.getCloudFrontSignedUrl(
        user.profileImagePath ?? DEFAULT_PROFILE_IMAGE_PATH
      );

      const profile = new ProfileDto({
        firstName: user.firstName!,
        lastName: user.lastName!,
        gender: user.gender!,
        countryCode: user.countryCode!,
        phoneNumber: user.phoneNumber!,
        email: user.email!,
        dob: user.dob!,
        profileImageUrl: profileImageUrl,
      });

      successResponseHandler({
        res: res,
        status: 200,
        data: profile,
      });
    }
  );

  static readonly getPublicUser: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.params.userId;

      const userExists = await AuthDatasource.isUserActive(userId);
      if (!userExists) {
        throw new CustomError(404, "User not found!");
      }

      const user = await ProfileDatasource.getPublicUserById(userId);

      const profileImageUrl = AwsS3Service.getCloudFrontSignedUrl(
        user.profileImagePath ?? DEFAULT_PROFILE_IMAGE_PATH
      );

      const profile = new PublicProfileDto({
        firstName: user.firstName!,
        lastName: user.lastName!,
        profileImageUrl: profileImageUrl,
      });

      successResponseHandler({
        res: res,
        status: 200,
        data: profile,
      });
    }
  );

  static readonly validateUpdateProfileRequest: RequestHandler = (
    req,
    res,
    next
  ) => {
    req.parsedData = validateModel(updateProfileSchema, req.body);
    next();
  };

  static readonly updateProfile: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const parsedData = req.parsedData! as UpdateProfileType;

      // If the image file is passed, then deleting the old image from S3 (if exists),
      // And then adding the new one.
      let imagePath: string | null = null;
      let imageUrl: string | null = null;
      const imageFile = req.file as Express.Multer.File | undefined;
      if (imageFile !== undefined) {
        await deleteCustomProfileImage(userId);

        imagePath = await AwsS3Service.uploadFile(
          imageFile,
          AwsS3FileCategory.profiles
        );
        imageUrl = AwsS3Service.getCloudFrontSignedUrl(imagePath);
      }

      const updatedFields: Record<string, any> = {
        ...parsedData,
      };
      if (imagePath !== null) {
        updatedFields["profileImagePath"] = imagePath;
      }

      await ProfileDatasource.updateProfile(userId, updatedFields);

      const resData: Record<string, any> = {};
      if (imageUrl !== null) {
        resData["profileImageUrl"] = imageUrl;
      }

      successResponseHandler({
        res: res,
        status: 200,
        data: resData,
      });
    }
  );

  static readonly deleteProfileImage: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      await deleteCustomProfileImage(userId);
      await ProfileDatasource.resetProfileImage(userId);

      const profileImageUrl = AwsS3Service.getCloudFrontSignedUrl(
        DEFAULT_PROFILE_IMAGE_PATH
      );

      successResponseHandler({
        res: res,
        status: 200,
        data: {
          profileImageUrl: profileImageUrl,
        },
      });
    }
  );

  static readonly requestAccountDeletion: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      // Checking if the user is already marked for deletion
      const userStatus = await AuthDatasource.getUserStatus(userId);
      if (userStatus === EntityStatus.scheduledDeletion) {
        throw new CustomError(
          409,
          "A deletion request already exists for this account. Can not initiate a duplicate one."
        );
      }

      const model = new UserDeletionRequestModel({
        userId: userId,
        deleteAt: addDays(
          new Date(),
          USER_ACCOUNT_DELETION_BUFFER_TIME_IN_DAYS
        ),
      });

      await performTransaction<void>(async (transaction) => {
        await AuthDatasource.signOutAllSessions(userId, transaction);
        await AuthDatasource.markUserForDeletion(userId, transaction);
        await ProfileDatasource.createUserDeletionRequest(model, transaction);
      });

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );
}
