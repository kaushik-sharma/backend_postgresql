import {
  initSessionModel,
  associateSessionModel,
} from "./session/session_model.js";
import { initUserModel, associateUserModel } from "./user/user_model.js";
import {
  initUserDeletionRequestModel,
  associateUserDeletionRequestModel,
} from "./profile/user_deletion_request_model.js";
import {
  initCommentModel,
  associateCommentModel,
} from "./post/comment_model.js";
import { initPostModel, associatePostModel } from "./post/post_model.js";
import {
  initReactionModel,
  associateReactionModel,
} from "./post/reaction_model.js";
import {
  initReportPostModel,
  associateReportPostModel,
} from "./moderation/report_post_model.js";
import {
  initReportCommentModel,
  associateReportCommentModel,
} from "./moderation/report_comment_model.js";
import {
  initReportUserModel,
  associateReportUserModel,
} from "./moderation/report_user_model.js";

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

  associateSessionModel();
  associateUserModel();
  associateUserDeletionRequestModel();
  associatePostModel();
  associateCommentModel();
  associateReactionModel();
  associateReportPostModel();
  associateReportCommentModel();
  associateReportUserModel();
};
