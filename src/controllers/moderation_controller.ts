import { RequestHandler } from "express";

import { validateModel } from "../helpers/validation_helper.js";
import { reportSchema, ReportType } from "../validation/moderation_schema.js";
import { asyncHandler } from "../helpers/async_handler.js";
import PostDatasource from "../datasources/post_datasource.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import ModerationDatasource from "../datasources/moderation_datasource.js";
import { ReportPostModel } from "../models/moderation/report_post_model.js";
import {
  COMMENT_BAN_THRESHOLD,
  POST_BAN_THRESHOLD,
  USER_BAN_THRESHOLD,
} from "../constants/values.js";
import { successResponseHandler } from "../helpers/success_handler.js";
import { ReportCommentModel } from "../models/moderation/report_comment_model.js";
import AuthDatasource from "../datasources/auth_datasource.js";
import { ReportUserModel } from "../models/moderation/report_user_model.js";
import { performTransaction } from "../helpers/transaction_helper.js";

export default class ModerationController {
  static readonly validateReportRequest: RequestHandler = (req, res, next) => {
    req.parsedData = validateModel(reportSchema, req.body);
    next();
  };

  static readonly reportPost: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const parsedData = req.parsedData! as ReportType;
      const postId = req.params.postId;

      const postExists: boolean = await PostDatasource.postExists(postId);
      if (!postExists) {
        throw new CustomError(404, "Post not found!");
      }

      const postUserId = await PostDatasource.getPostUserId(postId);
      if (userId === postUserId) {
        throw new CustomError(403, "Can not report your own post!");
      }

      const model = new ReportPostModel({
        postId: postId,
        userId: userId,
        reason: parsedData.reason,
      });
      await ModerationDatasource.reportPost(model);

      const postReportCount = await ModerationDatasource.postReportCount(
        postId
      );

      if (postReportCount >= POST_BAN_THRESHOLD()) {
        await ModerationDatasource.banPost(postId);
      }

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );

  static readonly reportComment: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const parsedData = req.parsedData! as ReportType;
      const commentId = req.params.commentId;

      const commentExists: boolean = await PostDatasource.commentExists(
        commentId
      );
      if (!commentExists) {
        throw new CustomError(404, "Comment not found!");
      }

      const commentUserId = await PostDatasource.getCommentUserId(commentId);
      if (userId === commentUserId) {
        throw new CustomError(403, "Can not report your own comment!");
      }

      const model = new ReportCommentModel({
        commentId: commentId,
        userId: userId,
        reason: parsedData.reason,
      });
      await ModerationDatasource.reportComment(model);

      const commentReportCount = await ModerationDatasource.commentReportCount(
        commentId
      );

      if (commentReportCount >= COMMENT_BAN_THRESHOLD()) {
        await ModerationDatasource.banComment(commentId);
      }

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );

  static readonly reportUser: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const parsedData = req.parsedData! as ReportType;
      const reportedUserId = req.params.reportedUserId;

      const userExists = await AuthDatasource.isUserActive(reportedUserId);
      if (!userExists) {
        throw new CustomError(404, "User not found!");
      }

      if (userId === reportedUserId) {
        throw new CustomError(403, "Can not report your own account!");
      }

      const model = new ReportUserModel({
        reportedUserId: reportedUserId,
        userId: userId,
        reason: parsedData.reason,
      });
      await ModerationDatasource.reportUser(model);

      const userReportedCount = await ModerationDatasource.userReportedCount(
        reportedUserId
      );
      if (userReportedCount >= USER_BAN_THRESHOLD()) {
        await performTransaction<void>(async (transaction) => {
          await ModerationDatasource.banUser(reportedUserId, transaction);
          await AuthDatasource.signOutAllSessions(reportedUserId, transaction);
        });
      }

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );
}
