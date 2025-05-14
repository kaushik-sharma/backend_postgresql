import { CommentModel } from "./post/comment_model.js";
import { PostModel } from "./post/post_model.js";
import { ReactionModel } from "./post/reaction_model.js";
import { UserDeletionRequestModel } from "./user/user_deletion_request_model.js";
import { SessionModel } from "./session/session_model.js";
import { UserModel } from "./user/user_model.js";
import { ConnectionModel } from "./connections/connections_model.js";
import { ReportModel } from "./moderation/report_model.js";

export const initModels = () => {
  UserModel.initialize();
  SessionModel.initialize();
  UserDeletionRequestModel.initialize();
  PostModel.initialize();
  CommentModel.initialize();
  ReactionModel.initialize();
  ReportModel.initialize();
  ConnectionModel.initialize();

  UserModel.associate();
  SessionModel.associate();
  UserDeletionRequestModel.associate();
  PostModel.associate();
  CommentModel.associate();
  ReactionModel.associate();
  ReportModel.associate();
  ConnectionModel.associate();
};
