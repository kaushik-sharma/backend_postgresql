import { deleteCustomProfileImage } from "../controllers/profile_controller.js";
import AuthDatasource from "../datasources/auth_datasource.js";
import PostDatasource from "../datasources/post_datasource.js";
import ProfileDatasource from "../datasources/profile_datasource.js";
import logger from "../utils/logger.js";
import { performTransaction } from "./transaction_helper.js";

export const deleteScheduledUserAccounts = async () => {
  const dueRequests = await ProfileDatasource.getDueUserDeletions();

  for (const request of dueRequests) {
    await deleteCustomProfileImage(request.userId);
    await performTransaction<void>(async (transaction) => {
      await AuthDatasource.signOutAllSessions(request.userId, transaction);
      await ProfileDatasource.deleteAccount(request.userId, transaction);
      await PostDatasource.deletePostsByUserId(request.userId, transaction);
      await PostDatasource.deleteCommentsByUserId(request.userId, transaction);
      await PostDatasource.deleteReactionsByUserId(request.userId, transaction);
      await ProfileDatasource.removeDeletionRequest(
        request.userId,
        transaction
      );
    });
  }

  logger.info(`Deleted ${dueRequests.length} scheduled user deletions.`);
};
