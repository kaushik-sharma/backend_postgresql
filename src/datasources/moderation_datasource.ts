import { EntityStatus } from "../constants/enums.js";
import { UserModel } from "../models/auth/user_model.js";
import {
  ReportCommentModel,
  ReportCommentType,
} from "../models/moderation/report_comment_model.js";
import {
  ReportPostModel,
  ReportPostType,
} from "../models/moderation/report_post_model.js";
import {
  ReportUserModel,
  ReportUserType,
} from "../models/moderation/report_user_model.js";
import { CommentModel } from "../models/post/comment_model.js";
import { PostModel } from "../models/post/post_model.js";

export default class ModerationDatasource {
  static readonly reportPost = async (data: ReportPostType): Promise<void> => {
    const model = new ReportPostModel(data);
    await model.save();
  };

  static readonly postReportCount = async (postId: string): Promise<number> => {
    return await ReportPostModel.countDocuments({ postId: postId });
  };

  static readonly banPost = async (postId: string): Promise<void> => {
    await PostModel.updateOne(
      { _id: postId },
      {
        $set: {
          status: EntityStatus.banned,
        },
      }
    );
  };

  static readonly reportComment = async (
    data: ReportCommentType
  ): Promise<void> => {
    const model = new ReportCommentModel(data);
    await model.save();
  };

  static readonly commentReportCount = async (
    commentId: string
  ): Promise<number> => {
    return await ReportCommentModel.countDocuments({ commentId: commentId });
  };

  static readonly banComment = async (commentId: string): Promise<void> => {
    await CommentModel.updateOne(
      { _id: commentId },
      {
        $set: {
          status: EntityStatus.banned,
        },
      }
    );
  };

  static readonly reportUser = async (data: ReportUserType): Promise<void> => {
    const model = new ReportUserModel(data);
    await model.save();
  };

  static readonly userReportedCount = async (
    userId: string
  ): Promise<number> => {
    return await ReportUserModel.countDocuments({ userId: userId });
  };

  static readonly banUser = async (userId: string): Promise<void> => {
    await UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          status: EntityStatus.banned,
        },
      }
    );
  };
}
