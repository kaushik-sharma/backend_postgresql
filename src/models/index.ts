import { initSessionModel } from "./session/session_model.js";
import { initUserModel } from "./user/user_model.js";
import { initUserDeletionRequestModel } from "./profile/user_deletion_request_model.js";
import { initCommentModel } from "./post/comment_model.js";
import { initPostModel } from "./post/post_model.js";
import { initReactionModel } from "./post/reaction_model.js";
import { initReportPostModel } from "./moderation/report_post_model.js";
import { initReportCommentModel } from "./moderation/report_comment_model.js";
import { initReportUserModel } from "./moderation/report_user_model.js";

export const initModels = () => {
  initSessionModel();
  initUserModel();
  initUserDeletionRequestModel();
  initPostModel();
  initCommentModel();
  initReactionModel();
  initReportPostModel();
  initReportCommentModel();
  initReportUserModel();
};
