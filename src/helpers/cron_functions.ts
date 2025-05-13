import { deleteCustomProfileImage } from "../controllers/user_controller.js";
import SessionDatasource from "../datasources/session_datasource.js";
import UserDatasource from "../datasources/user_datasource.js";
import logger from "../utils/logger.js";
import { performTransaction } from "./transaction_helper.js";

export const deleteScheduledUserAccounts = async () => {
  const userIds = await UserDatasource.getDueDeletionUserIds();

  for (const userId of userIds) {
    await deleteCustomProfileImage(userId);

    await performTransaction<void>(async (transaction) => {
      await SessionDatasource.signOutAllSessions(userId, transaction);
      await UserDatasource.deleteUser(userId, transaction);
      await UserDatasource.removeDeletionRequest(userId, transaction);
    });
  }

  logger.info(`Deleted ${userIds.length} scheduled user deletions.`);
};
