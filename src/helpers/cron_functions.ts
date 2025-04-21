import { deleteCustomProfileImage } from "../controllers/profile_controller.js";
import AuthDatasource from "../datasources/auth_datasource.js";
import ProfileDatasource from "../datasources/profile_datasource.js";
import logger from "../utils/logger.js";
import { performTransaction } from "./transaction_helper.js";

export const deleteScheduledUserAccounts = async () => {
  const userIds = await ProfileDatasource.getDueDeletionUserIds();

  for (const userId of userIds) {
    await deleteCustomProfileImage(userId);

    await performTransaction<void>(async (transaction) => {
      await AuthDatasource.signOutAllSessions(userId, transaction);
      await ProfileDatasource.deleteUser(userId, transaction);
      await ProfileDatasource.removeDeletionRequest(userId, transaction);
    });
  }

  logger.info(`Deleted ${userIds.length} scheduled user deletions.`);
};
