import { RequestHandler } from "express";

import {
  ReportPostModel,
  ReportPostType,
} from "../models/moderation/report_post_model.js";
import { validateModel } from "../helpers/validation_helpers.js";
import ModerationDatasource from "../datasources/moderation_datasource.js";
import { successResponseHandler } from "../helpers/custom_handlers.js";
import {
  ReportCommentModel,
  ReportCommentType,
} from "../models/moderation/report_comment_model.js";
import PostDatasource from "../datasources/post_datasource.js";
import {
  ReportUserModel,
  ReportUserRequestModel,
  ReportUserRequestType,
  ReportUserType,
} from "../models/moderation/report_user_model.js";
import AuthDatasource from "../datasources/auth_datasource.js";
import {
  POST_BAN_THRESHOLD,
  COMMENT_BAN_THRESHOLD,
  USER_BAN_THRESHOLD,
} from "../constants/values.js";
import { asyncHandler } from "../helpers/exception_handlers.js";
import { CustomError } from "../middlewares/error_middlewares.js";

export const validateReportPostRequest: RequestHandler = (req, res, next) => {
  const requestBody = {
    ...req.body,
    postId: req.params.postId,
  };
  const reportPostModel = new ReportPostModel(requestBody as ReportPostType);
  validateModel(reportPostModel);
  next();
};

export const reportPost: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const userId = req.user!.userId;

    const requestBody = {
      ...req.body,
      postId: req.params.postId,
    };
    const reportPostModel = new ReportPostModel(requestBody as ReportPostType);

    const postExists: boolean = await PostDatasource.postExists(
      reportPostModel.postId!.toString()
    );
    if (!postExists) {
      throw new CustomError(404, "Post not found!");
    }

    const postUserId = await PostDatasource.getPostUserId(
      reportPostModel.postId!.toString()
    );
    if (userId === postUserId) {
      throw new CustomError(403, "Can not report your own post!");
    }

    await ModerationDatasource.reportPost(reportPostModel);

    const postReportCount = await ModerationDatasource.postReportCount(
      reportPostModel.postId!.toString()
    );

    if (postReportCount >= POST_BAN_THRESHOLD) {
      await ModerationDatasource.banPost(reportPostModel.postId!.toString());
    }

    successResponseHandler({
      res: res,
      status: 200,
    });
  }
);

export const validateReportCommentRequest: RequestHandler = (
  req,
  res,
  next
) => {
  const requestBody = {
    ...req.body,
    commentId: req.params.commentId,
  };
  const reportCommentModel = new ReportCommentModel(
    requestBody as ReportCommentType
  );
  validateModel(reportCommentModel);
  next();
};

export const reportComment: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const userId = req.user!.userId;

    const requestBody = {
      ...req.body,
      commentId: req.params.commentId,
    };
    const reportCommentModel = new ReportCommentModel(
      requestBody as ReportCommentType
    );

    const commentExists: boolean = await PostDatasource.commentExists(
      reportCommentModel.commentId!.toString()
    );
    if (!commentExists) {
      throw new CustomError(404, "Comment not found!");
    }

    const commentUserId = await PostDatasource.getCommentUserId(
      reportCommentModel.commentId!.toString()
    );
    if (userId === commentUserId) {
      throw new CustomError(403, "Can not report your own comment!");
    }

    await ModerationDatasource.reportComment(reportCommentModel);

    const commentReportCount = await ModerationDatasource.commentReportCount(
      reportCommentModel.commentId!.toString()
    );

    if (commentReportCount >= COMMENT_BAN_THRESHOLD) {
      await ModerationDatasource.banComment(
        reportCommentModel.commentId!.toString()
      );
    }

    successResponseHandler({
      res: res,
      status: 200,
    });
  }
);

export const validateReportUserRequest: RequestHandler = (req, res, next) => {
  const reportUserRequestModel = new ReportUserRequestModel(
    req.body as ReportUserRequestType
  );
  validateModel(reportUserRequestModel);
  next();
};

export const reportUser: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const userId = req.user!.userId;

    const reportUserRequestModel = new ReportUserRequestModel(
      req.body as ReportUserRequestType
    );

    const reportedUserId = await AuthDatasource.getUserIdFromEmail(
      reportUserRequestModel.reportedUserEmail
    );
    if (reportedUserId === null) {
      throw new CustomError(404, "User not found!");
    }

    const reportUserData: Record<string, any> = {
      userId: reportedUserId,
      reason: reportUserRequestModel.reason,
    };

    const reportUserModel = new ReportUserModel(
      reportUserData as ReportUserType
    );

    validateModel(reportUserModel);

    if (userId === reportedUserId) {
      throw new CustomError(403, "Can not report yourself!");
    }

    await ModerationDatasource.reportUser(reportUserModel);

    const userReportedCount = await ModerationDatasource.userReportedCount(
      reportUserModel.userId!.toString()
    );

    if (userReportedCount >= USER_BAN_THRESHOLD) {
      await ModerationDatasource.banUser(reportUserModel.userId!.toString());
      await AuthDatasource.signOutAllSessions(reportedUserId);
    }

    successResponseHandler({
      res: res,
      status: 200,
    });
  }
);
