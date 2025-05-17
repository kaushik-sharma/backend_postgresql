import { RequestHandler } from "express";

import { validateData } from "../helpers/validation_helper.js";
import { reportSchema, ReportType } from "../validation/report_schema.js";
import { asyncHandler } from "../helpers/async_handler.js";
import { PostDatasource } from "../datasources/post_datasource.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import { ModerationDatasource } from "../datasources/moderation_datasource.js";
import { Constants } from "../constants/values.js";
import { successResponseHandler } from "../helpers/success_handler.js";
import { performTransaction } from "../helpers/transaction_helper.js";
import { UserDatasource } from "../datasources/user_datasource.js";
import { SessionDatasource } from "../datasources/session_datasource.js";
import { ReportAttributes } from "../models/moderation/report_model.js";
import { ReportTargetType } from "../constants/enums.js";

export class ModerationController {
  static readonly validateReportRequest: RequestHandler = (req, res, next) => {
    req.parsedData = validateData(reportSchema, req.body);
    next();
  };

  static readonly createReport: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const parsedData = req.parsedData! as ReportType;

      const data: ReportAttributes = {
        ...parsedData,
        reporterId: userId,
      };

      switch (data.targetType) {
        case ReportTargetType.post:
          const postUserId = await PostDatasource.getPostUserId(data.targetId);
          if (!postUserId) {
            throw new CustomError(404, "Post not found!");
          }
          if (postUserId === userId) {
            throw new CustomError(403, "Can not report your own post!");
          }
          break;
        case ReportTargetType.comment:
          const commentUserId = await PostDatasource.getCommentUserId(
            data.targetId
          );
          if (!commentUserId) {
            throw new CustomError(404, "Comment not found!");
          }
          if (commentUserId === userId) {
            throw new CustomError(403, "Can not report your own comment!");
          }
          break;
        case ReportTargetType.user:
          const isUserActive = await UserDatasource.isUserActive(data.targetId);
          if (!isUserActive) {
            throw new CustomError(404, "User not found!");
          }
          if (data.targetId === userId) {
            throw new CustomError(403, "Can not report yourself!");
          }
          break;
      }

      await ModerationDatasource.createReport(data);

      const count = await ModerationDatasource.getReportsCount(data.targetType);
      const threshold = Constants.contentModerationThreshold(data.targetType);

      if (count >= threshold) {
        switch (data.targetType) {
          case ReportTargetType.post:
            await PostDatasource.banPost(data.targetId);
            break;
          case ReportTargetType.comment:
            await PostDatasource.banComment(data.targetId);
            break;
          case ReportTargetType.user:
            await performTransaction<void>(async (tx) => {
              await SessionDatasource.signOutAllSessions(data.targetId, tx);
              await UserDatasource.banUser(data.targetId, tx);
            });
            break;
        }
      }

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );
}
