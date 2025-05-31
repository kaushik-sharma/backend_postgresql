import { RequestHandler } from "express";

import { ReportTargetType } from "../constants/enums.js";
import { ModerationDatasource } from "../datasources/moderation_datasource.js";
import { PostDatasource } from "../datasources/post_datasource.js";
import { SessionDatasource } from "../datasources/session_datasource.js";
import { UserDatasource } from "../datasources/user_datasource.js";
import { performTransaction } from "../helpers/transaction_helper.js";
import logger from "../utils/logger.js";
import { UserController } from "./user_controller.js";
import { asyncHandler } from "../helpers/async_handler.js";

export class CronController {
  static readonly deleteScheduledUsers: RequestHandler = asyncHandler(
    async (req, res, next) => {
      logger.info("Starting scheduled user account deletion task.");

      const userIds = await UserDatasource.getDueDeletionUserIds();

      for (const userId of userIds) {
        await performTransaction<void>(async (transaction) => {
          await UserController.deleteCustomProfileImage(userId, transaction);
          await UserDatasource.deleteUser(userId, transaction);
          await UserDatasource.removeDeletionRequest(userId, transaction);
        });
      }

      logger.info(`Deleted ${userIds.length} scheduled user deletions.`);
      logger.info("Completed scheduled user account deletion task.");
    }
  );

  static readonly moderationCheckup: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const checkReportTarget = async (targetType: ReportTargetType) => {
        await performTransaction(async (tx) => {
          const targetIds = await ModerationDatasource.fetchOverThresholdIds(
            targetType
          );

          for (const id of targetIds) {
            switch (targetType) {
              case ReportTargetType.post:
                const postExists = await PostDatasource.postExists(id);
                if (postExists) {
                  await PostDatasource.banPost(id, tx);
                }
                break;
              case ReportTargetType.comment:
                const commentExists = await PostDatasource.commentExists(id);
                if (commentExists) {
                  await PostDatasource.banComment(id, tx);
                }
                break;
              case ReportTargetType.user:
                const userExists = await UserDatasource.isUserActive(id);
                if (userExists) {
                  await SessionDatasource.signOutAllSessions(id, tx);
                  await UserDatasource.banUser(id, tx);
                }
                break;
            }
          }

          if (targetIds.length > 0) {
            await ModerationDatasource.markAsResolved(targetIds, tx);
          }
        });
      };

      logger.info("Starting moderation checkup.");

      const targetTypes = Object.values<ReportTargetType>(ReportTargetType);
      for (const targetType of targetTypes) {
        await checkReportTarget(targetType);
      }

      logger.info("Completed moderation checkup.");
    }
  );
}
