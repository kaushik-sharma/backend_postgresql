import { RequestHandler } from "express";

import { validateData } from "../helpers/validation_helper.js";
import { reportSchema, ReportType } from "../validation/report_schema.js";
import { asyncHandler } from "../helpers/async_handler.js";
import { PostDatasource } from "../datasources/post_datasource.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import { ModerationDatasource } from "../datasources/moderation_datasource.js";
import { successResponseHandler } from "../helpers/success_handler.js";
import { UserDatasource } from "../datasources/user_datasource.js";
import {
  Prisma,
  ReportStatus,
  ReportTargetType,
} from "../generated/prisma/index.js";

export class ModerationController {
  static readonly validateReportRequest: RequestHandler = (req, res, next) => {
    req.parsedData = validateData(reportSchema, req.body);
    next();
  };

  static readonly createReport: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const parsedData = req.parsedData! as ReportType;

      const data: Prisma.ReportCreateInput = {
        ...parsedData,
        reporter: { connect: { id: userId } },
        status: ReportStatus.ACTIVE,
      };

      switch (data.targetType) {
        case ReportTargetType.POST:
          const postUserId = await PostDatasource.getPostUserId(data.targetId);
          if (!postUserId) {
            throw new CustomError(404, "Post not found!");
          }
          if (postUserId === userId) {
            throw new CustomError(403, "Can not report your own post!");
          }
          break;
        case ReportTargetType.COMMENT:
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
        case ReportTargetType.USER:
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

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );
}
