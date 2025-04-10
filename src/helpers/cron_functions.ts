import { deleteCustomProfileImage } from "../controllers/profile_controller.js";
import ProfileDatasource from "../datasources/profile_datasource.js";
import { UserDeletionRequestType } from "../models/profile/user_deletion_request_model.js";
import logger from "../utils/logger.js";

export const deleteScheduledUserAccounts = async () => {
  const users: UserDeletionRequestType[] =
    await ProfileDatasource.getDueUserDeletions();

  for (const user of users) {
    await deleteCustomProfileImage(user.userId.toString());
    await ProfileDatasource.deleteAccount(user.userId.toString());
    await ProfileDatasource.removeDeletionRequest(user.userId.toString());
  }

  logger.info(`Deleted ${users.length} scheduled user deletions.`);
};
