import { RequestHandler } from "express";
import { DateTime } from "luxon";

import { Prisma, Session, User } from "../generated/prisma/index.js";
import { asyncHandler } from "../helpers/async_handler.js";
import {
  successResponseHandler,
  SuccessResponseHandlerParams,
} from "../helpers/success_handler.js";
import { AwsS3Service, AwsS3FileCategory } from "../services/aws_s3_service.js";
import { Constants } from "../constants/values.js";
import { validateData } from "../helpers/validation_helper.js";
import {
  updateProfileSchema,
  UpdateProfileType,
} from "../validation/profile_schema.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import { UserDatasource } from "../datasources/user_datasource.js";
import { ProfileDto, PublicProfileDto } from "../dtos/profile_dto.js";
import {
  ActiveSessionParams,
  ActiveSessionsOverviewDto,
} from "../dtos/session_dto.js";
import { PrismaService } from "../services/prisma_service.js";
import { SessionDatasource } from "../datasources/session_datasource.js";

export type ProfileUser = User & {
  followerCount: number;
  followeeCount: number;
  isFollowee: boolean;
};

export type ActiveSessionInfo = Pick<
  Session,
  "id" | "deviceName" | "platform" | "createdAt"
>;

export class UserController {
  static readonly getUser: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const user = (await UserDatasource.getUserById(userId, [
        "firstName",
        "lastName",
        "gender",
        "countryCode",
        "phoneNumber",
        "email",
        "dob",
        "profileImagePath",
      ]))!;

      const profileImageUrl = AwsS3Service.getCloudFrontSignedUrl(
        user.profileImagePath ?? Constants.defaultProfileImagePath
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
        followerCount: user.followerCount!,
        followeeCount: user.followeeCount!,
      });

      successResponseHandler({
        res: res,
        status: 200,
        data: profile,
      });
    }
  );

  static readonly getPublicProfile: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;
      const otherUserId = req.params.userId;

      const user = await UserDatasource.getUserById(
        otherUserId,
        ["firstName", "lastName", "profileImagePath"],
        userId
      );
      if (user === null) {
        throw new CustomError(404, "User not found!");
      }

      const profileImageUrl = AwsS3Service.getCloudFrontSignedUrl(
        user.profileImagePath ?? Constants.defaultProfileImagePath
      );

      const profile = new PublicProfileDto({
        firstName: user.firstName!,
        lastName: user.lastName!,
        profileImageUrl: profileImageUrl,
        followerCount: user.followerCount!,
        followeeCount: user.followeeCount!,
        isFollowee: user.isFollowee!,
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
    req.parsedData = validateData(updateProfileSchema, req.body);
    next();
  };

  static readonly updateProfile: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const parsedData = req.parsedData! as UpdateProfileType;

      let imagePath: string | null = null;
      let imageUrl: string | null = null;
      const imageFile = req.file as Express.Multer.File | undefined;
      if (imageFile !== undefined) {
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

      await PrismaService.client.$transaction<void>(async (tx) => {
        await this.deleteCustomProfileImage(userId, tx);
        await UserDatasource.updateProfile(userId, updatedFields, tx);
      });

      const resData: SuccessResponseHandlerParams = {
        res: res,
        status: 200,
      };
      if (imageUrl) {
        resData.data = { profileImageUrl: imageUrl };
      }

      successResponseHandler(resData);
    }
  );

  static readonly deleteProfileImage: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      await this.deleteCustomProfileImage(userId);

      const profileImageUrl = AwsS3Service.getCloudFrontSignedUrl(
        Constants.defaultProfileImagePath
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

      const deleteAt = DateTime.utc()
        .plus(Constants.userDeletionGracePeriodDuration)
        .toJSDate();

      const data: Prisma.UserDeletionRequestCreateInput = {
        deleteAt: deleteAt,
        user: { connect: { id: userId } },
      };

      await PrismaService.client.$transaction<void>(async (tx) => {
        await SessionDatasource.signOutAllSessions(userId, tx);
        await UserDatasource.markUserForDeletion(userId, tx);
        await UserDatasource.createUserDeletionRequest(data, tx);
      });

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );

  static readonly getActiveSessions: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;
      const currentSessionId = req.user!.sessionId;

      const sessions = await SessionDatasource.getActiveSessions(userId);

      let currentSession: ActiveSessionParams;
      let otherSessions: ActiveSessionParams[] = [];

      for (const session of sessions) {
        const data: ActiveSessionParams = {
          id: session.id!,
          deviceName: session.deviceName,
          platform: session.platform,
          createdAt: session.createdAt!,
        };
        if (session.id! === currentSessionId) {
          currentSession = data;
        } else {
          otherSessions.push(data);
        }
      }

      const sessionsOverview = new ActiveSessionsOverviewDto({
        current: currentSession!,
        others: otherSessions,
      });

      successResponseHandler({
        res: res,
        status: 200,
        data: sessionsOverview,
      });
    }
  );

  static readonly signOutCurrentSession: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const { userId, sessionId } = req.user!;

      await SessionDatasource.signOutSession(sessionId, userId);

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );

  static readonly signOutAllSessions: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      await SessionDatasource.signOutAllSessions(userId);

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );

  static readonly signOutBySessionId: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const sessionId = req.params.sessionId;

      const sessionUserId = await SessionDatasource.getUserIdFromSessionId(
        sessionId
      );
      if (sessionUserId === null) {
        throw new CustomError(404, "Session not found!");
      }
      if (sessionUserId !== userId) {
        throw new CustomError(403, "Session user ID mismatch!");
      }

      await SessionDatasource.signOutSession(sessionId, userId);

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );

  static readonly deleteCustomProfileImage = async (
    userId: string,
    transaction?: Prisma.TransactionClient
  ): Promise<void> => {
    const profileImagePath = await UserDatasource.getUserProfileImagePath(
      userId
    );
    if (profileImagePath !== null) {
      AwsS3Service.initiateDeleteFile(profileImagePath);
      await UserDatasource.deleteProfileImage(userId, transaction);
    }
  };
}
