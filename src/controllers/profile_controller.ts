import { RequestHandler } from "express";
import { addDays } from "date-fns";

import {
  successResponseHandler,
  SuccessResponseHandlerParams,
} from "../helpers/custom_handlers.js";
import ProfileDatasource from "../datasources/profile_datasource.js";
import AuthDatasource from "../datasources/auth_datasource.js";
import {
  ProfileUpdateModel,
  ProfileUpdateType,
} from "../models/profile/profile_update_model.js";
import { validateModel } from "../helpers/validation_helpers.js";
import AwsS3Service, { AwsS3FileCategory } from "../services/aws_s3_service.js";
import { asyncHandler } from "../helpers/exception_handlers.js";
import { DEFAULT_PROFILE_IMAGE_PATH } from "../constants/values.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import { UserDeletionRequestModel } from "../models/profile/user_deletion_request_model.js";

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

export const getUser: RequestHandler = asyncHandler(async (req, res, next) => {
  const userId = req.user!.userId;

  const user = await ProfileDatasource.getUserById(userId);

  successResponseHandler({
    res: res,
    status: 200,
    data: user,
  });
});

export const requestAccountDeletion: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const userId = req.user!.userId;

    // Check if a deletion schedule record already exists for the user account
    const exists = await ProfileDatasource.userDeletionRequestExists(userId);
    if (exists) {
      throw new CustomError(
        409,
        "A deletion request already exists for this account."
      );
    }

    const data: Record<string, any> = {
      userId: userId,
      deleteAt: addDays(new Date(), 30),
    };
    const model = new UserDeletionRequestModel(data);
    validateModel(model);

    await AuthDatasource.signOutAllSessions(userId);
    await ProfileDatasource.createUserDeletionRequest(model);

    successResponseHandler({
      res: res,
      status: 200,
    });
  }
);

export const validateUpdateProfileRequest: RequestHandler = (
  req,
  res,
  next
) => {
  const profile = new ProfileUpdateModel(req.body as ProfileUpdateType);
  validateModel(profile);
  next();
};

export const updateProfile: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const userId = req.user!.userId;

    const profile = new ProfileUpdateModel(req.body as ProfileUpdateType);

    // If the image file is passed, delete the old image from S3
    // Then add the new file.
    let imagePath: string | null = null;
    const imageFile = req.file as Express.Multer.File | undefined;
    if (imageFile !== undefined) {
      await deleteCustomProfileImage(userId);

      imagePath = await AwsS3Service.uploadFile(
        imageFile,
        AwsS3FileCategory.profiles
      );
    }

    const profileData: Record<string, any> = (profile as Record<string, any>)[
      "_doc"
    ];

    const updatedProfile = new ProfileUpdateModel({
      ...profileData,
      profileImagePath: imagePath,
    });

    validateModel(updatedProfile);

    await ProfileDatasource.updateProfile(userId, updatedProfile);

    const profileImageUrl =
      imagePath !== null
        ? AwsS3Service.getCloudfrontDownloadUrl(imagePath)
        : null;

    const response: SuccessResponseHandlerParams = {
      res: res,
      status: 200,
      ...(profileImageUrl !== null && { data: { profileImageUrl } }),
    };

    successResponseHandler(response);
  }
);

export const deleteProfileImage: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const userId = req.user!.userId;

    await deleteCustomProfileImage(userId);
    await ProfileDatasource.resetProfileImage(userId);

    const profileImageUrl = AwsS3Service.getCloudfrontDownloadUrl(
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
