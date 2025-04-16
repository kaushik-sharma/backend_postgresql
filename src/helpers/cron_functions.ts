import { deleteCustomProfileImage } from "../controllers/profile_controller.js";
import ProfileDatasource from "../datasources/profile_datasource.js";
import logger from "../utils/logger.js";
import { performTransaction } from "./transaction_helper.js";

export const deleteScheduledUserAccounts = async () => {
  const dueRequests = await ProfileDatasource.getDueUserDeletions();

  for (const request of dueRequests) {
    await deleteCustomProfileImage(request.userId);
    await performTransaction<void>(async (transaction) => {
      await ProfileDatasource.deleteAccount(request.userId, transaction);
      await ProfileDatasource.removeDeletionRequest(
        request.userId,
        transaction
      );
    });
  }

  logger.info(`Deleted ${dueRequests.length} scheduled user deletions.`);
};
