import { ReportCommentModel } from "./moderation/report_comment_model.js";
import { ReportPostModel } from "./moderation/report_post_model.js";
import { ReportUserModel } from "./moderation/report_user_model.js";
import { CommentModel } from "./post/comment_model.js";
import { PostModel } from "./post/post_model.js";
import { ReactionModel } from "./post/reaction_model.js";
import { UserDeletionRequestModel } from "./user/user_deletion_request_model.js";
import { SessionModel } from "./session/session_model.js";
import { UserModel } from "./user/user_model.js";
import { ConnectionModel } from "./connections/connections_model.js";

export const initModels = () => {
  UserModel.initialize();
  SessionModel.initialize();
  UserDeletionRequestModel.initialize();
  PostModel.initialize();
  CommentModel.initialize();
  ReactionModel.initialize();
  ReportPostModel.initialize();
  ReportCommentModel.initialize();
  ReportUserModel.initialize();
  ConnectionModel.initialize();

  UserModel.associate();
  SessionModel.associate();
  UserDeletionRequestModel.associate();
  PostModel.associate();
  CommentModel.associate();
  ReactionModel.associate();
  ReportPostModel.associate();
  ReportCommentModel.associate();
  ReportUserModel.associate();
  ConnectionModel.associate();
};
