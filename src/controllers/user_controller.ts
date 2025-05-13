import { RequestHandler } from "express";
import { DateTime } from "luxon";

import { asyncHandler } from "../helpers/async_handler.js";
import { successResponseHandler } from "../helpers/success_handler.js";
import AwsS3Service, { AwsS3FileCategory } from "../services/aws_s3_service.js";
import {
  DEFAULT_PROFILE_IMAGE_PATH,
  USER_DELETION_GRACE_PERIOD_DURATION,
} from "../constants/values.js";
import { validateData } from "../helpers/validation_helper.js";
import {
  updateProfileSchema,
  UpdateProfileType,
} from "../validation/profile_schema.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import { UserDeletionRequestModel } from "../models/user/user_deletion_request_model.js";
import { performTransaction } from "../helpers/transaction_helper.js";
import { EntityStatus } from "../constants/enums.js";
import UserDatasource from "../datasources/user_datasource.js";
import SessionDatasource from "../datasources/session_datasource.js";
import { ProfileDto, PublicProfileDto } from "../dtos/profile_dto.js";
import {
  ActiveSessionParams,
  ActiveSessionsOverviewDto,
} from "../dtos/session_dto.js";
import ConnectionDatasource from "../datasources/connection_datasource.js";
import PostDatasource from "../datasources/post_datasource.js";
import { PostAttributes } from "../models/post/post_model.js";
import { UserPostDto } from "../dtos/user_post_dto.js";
import { UserCommentDto } from "../dtos/user_comment_dto.js";

export const deleteCustomProfileImage = async (
  userId: string
): Promise<void> => {
  const profileImagePath = await UserDatasource.getUserProfileImagePath(userId);
  if (profileImagePath !== null) {
    AwsS3Service.initiateDeleteFile(profileImagePath);
  }
};

export default class UserController {
  static readonly getUser: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const user = await UserDatasource.getUserById(userId);

      const profileImageUrl = AwsS3Service.getCloudFrontSignedUrl(
        user.profileImagePath ?? DEFAULT_PROFILE_IMAGE_PATH
      );

      const followerCount = await ConnectionDatasource.getFollowerCount(userId);
      const followingCount = await ConnectionDatasource.getFollowingCount(
        userId
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
        followerCount: followerCount,
        followingCount: followingCount,
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

      const user = await UserDatasource.getPublicUserById(otherUserId);
      if (user === null) {
        throw new CustomError(404, "User not found!");
      }

      const profileImageUrl = AwsS3Service.getCloudFrontSignedUrl(
        user.profileImagePath ?? DEFAULT_PROFILE_IMAGE_PATH
      );

      const followerCount = await ConnectionDatasource.getFollowerCount(
        otherUserId
      );
      const followingCount = await ConnectionDatasource.getFollowingCount(
        otherUserId
      );

      const isFollowee = await ConnectionDatasource.isFollowee(
        userId,
        otherUserId
      );

      const profile = new PublicProfileDto({
        firstName: user.firstName!,
        lastName: user.lastName!,
        profileImageUrl: profileImageUrl,
        followerCount: followerCount,
        followingCount: followingCount,
        isFollowee: isFollowee,
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

      await UserDatasource.updateProfile(userId, updatedFields);

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
      await UserDatasource.resetProfileImage(userId);

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
      const userStatus = await UserDatasource.getUserStatus(userId);
      if (userStatus === EntityStatus.requestedDeletion) {
        throw new CustomError(
          409,
          "A deletion request already exists for this account. Can not initiate a duplicate one."
        );
      }

      const deleteAt = DateTime.utc()
        .plus(USER_DELETION_GRACE_PERIOD_DURATION())
        .toJSDate();

      const model = new UserDeletionRequestModel({
        userId: userId,
        deleteAt: deleteAt,
      });

      await performTransaction<void>(async (transaction) => {
        await SessionDatasource.signOutAllSessions(userId, transaction);
        await UserDatasource.markUserForDeletion(userId, transaction);
        await UserDatasource.createUserDeletionRequest(model, transaction);
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
        throw new CustomError(403, "Session user id mismatch!");
      }

      await SessionDatasource.signOutSession(sessionId, userId);

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );

  static readonly #processUserPosts = (
    posts: PostAttributes[]
  ): UserPostDto[] => {
    return posts.map((post) => {
      const postImageUrl =
        post.imagePath != null
          ? AwsS3Service.getCloudFrontSignedUrl(post.imagePath)
          : null;

      return new UserPostDto({
        id: post.id!,
        text: post.text,
        imageUrl: postImageUrl,
        likeCount: post.likeCount!,
        dislikeCount: post.dislikeCount!,
        commentCount: post.commentCount!,
        createdAt: post.createdAt!,
      });
    });
  };

  static readonly getUserPosts: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const page = parseInt(req.query.page as string);
      if (page < 0) {
        throw new CustomError(400, "Page can not be less than zero!");
      }

      const posts = await PostDatasource.getPostsByUserId(userId, page);
      const feed = this.#processUserPosts(posts);

      successResponseHandler({
        res: res,
        status: 200,
        data: feed,
      });
    }
  );

  static readonly getUserComments: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const page = parseInt(req.query.page as string);
      if (page < 0) {
        throw new CustomError(400, "Page can not be less than zero!");
      }

      const comments = await PostDatasource.getCommentsByUserId(userId, page);

      const commentDtos = comments.map((comment) => {
        return new UserCommentDto({
          id: comment.id!,
          postId: comment.postId,
          text: comment.text,
          createdAt: comment.createdAt!,
        });
      });

      successResponseHandler({
        res: res,
        status: 200,
        data: commentDtos,
      });
    }
  );

  static readonly deletePost: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const postId = req.params.postId as string | undefined | null;
      if (postId === undefined || postId === null) {
        throw new CustomError(400, "Post ID is required.");
      }

      const postExists: boolean = await PostDatasource.postExists(postId);
      if (!postExists) {
        throw new CustomError(404, "Post not found!");
      }

      const postUserId: string = await PostDatasource.getPostUserId(postId);
      if (postUserId !== userId) {
        throw new CustomError(403, "Can not delete other users' posts!");
      }

      // Delete the post image if it exists from S3 & CloudFront
      const imagePath: string | null = await PostDatasource.getPostImagePath(
        postId
      );
      if (imagePath !== null) {
        AwsS3Service.initiateDeleteFile(imagePath);
      }

      await PostDatasource.deletePost(postId, userId);

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );

  static readonly deleteComment: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const commentId = req.params.commentId as string | undefined | null;
      if (commentId === undefined || commentId === null) {
        throw new CustomError(400, "Comment ID is required.");
      }

      const commentExists: boolean = await PostDatasource.commentExists(
        commentId
      );
      if (!commentExists) {
        throw new CustomError(404, "Comment not found!");
      }

      const commentUserId: string = await PostDatasource.getCommentUserId(
        commentId
      );
      if (commentUserId !== userId) {
        throw new CustomError(403, "Can not delete other users' comments!");
      }

      await PostDatasource.deleteComment(commentId, userId);

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );
}
