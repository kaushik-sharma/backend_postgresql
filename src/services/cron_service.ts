import cron from "node-cron";

import logger from "../utils/logger.js";
import { Constants } from "../constants/values.js";
import { Env, ReportTargetType } from "../constants/enums.js";
import { UserDatasource } from "../datasources/user_datasource.js";
import { UserController } from "../controllers/user_controller.js";
import { performTransaction } from "../helpers/transaction_helper.js";
import { SessionDatasource } from "../datasources/session_datasource.js";
import { ModerationDatasource } from "../datasources/moderation_datasource.js";
import { PostDatasource } from "../datasources/post_datasource.js";

export class CronService {
  static readonly init = () => {
    this.#scheduleDailyEmails();
    this.#scheduleRequestedUserDeletions();
    this.#scheduleModerationCheckup();
  };

  static readonly #scheduleDailyEmails = () => {
    // Sends regular notifications/emails. Runs at 10 AM everyday.
    cron.schedule("0 0 10 * * *", () => {
      logger.info("Sending emails.");
      // Send notifications / emails
      logger.info("Emails successfully sent.");
    });
  };

  static readonly #deleteScheduledUserAccounts = async () => {
    const userIds = await UserDatasource.getDueDeletionUserIds();

    for (const userId of userIds) {
      await UserController.deleteCustomProfileImage(userId);

      await performTransaction<void>(async (transaction) => {
        await SessionDatasource.signOutAllSessions(userId, transaction);
        await UserDatasource.deleteUser(userId, transaction);
        await UserDatasource.removeDeletionRequest(userId, transaction);
      });
    }

    logger.info(`Deleted ${userIds.length} scheduled user deletions.`);
  };

  static readonly #scheduleRequestedUserDeletions = () => {
    // Deletes due user accounts.
    // Runs at 12 AM and 12 PM everyday. (Prod)
    // Runs every 10 mins. (Dev)

    const cronExpression =
      Constants.env === Env.production ? "0 0 0,12 * * *" : "0 */10 * * * *";

    cron.schedule(cronExpression, async () => {
      logger.info("Starting scheduled user account deletion task.");
      await this.#deleteScheduledUserAccounts();
      logger.info("Completed scheduled user account deletion task.");
    });
  };

  static readonly performModerationCheckup = async () => {
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

    Object.values<ReportTargetType>(ReportTargetType).forEach(
      async (targetType) => {
        await checkReportTarget(targetType);
      }
    );
  };

  static readonly #scheduleModerationCheckup = () => {
    // Runs at 12 AM and 12 PM everyday. (Prod)
    // Runs every 10 mins. (Dev)

    const cronExpression =
      Constants.env === Env.production ? "0 0 0,12 * * *" : "0 */10 * * * *";

    cron.schedule(cronExpression, async () => {
      logger.info("Starting moderation checkup.");
      await this.performModerationCheckup();
      logger.info("Completed moderation checkup.");
    });
  };
}
