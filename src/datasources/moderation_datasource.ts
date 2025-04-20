import { Transaction } from "sequelize";
import { EntityStatus } from "../constants/enums.js";
import { UserModel } from "../models/user/user_model.js";
import { ReportCommentModel } from "../models/moderation/report_comment_model.js";
import { ReportPostModel } from "../models/moderation/report_post_model.js";
import { ReportUserModel } from "../models/moderation/report_user_model.js";
import { CommentModel } from "../models/post/comment_model.js";
import { PostModel } from "../models/post/post_model.js";

export default class ModerationDatasource {
  static readonly reportPost = async (
    model: ReportPostModel
  ): Promise<void> => {
    await model.save();
  };

  static readonly postReportCount = async (postId: string): Promise<number> => {
    return await ReportPostModel.count({ where: { postId: postId } });
  };

  static readonly banPost = async (postId: string): Promise<void> => {
    await PostModel.update(
      {
        status: EntityStatus.banned,
      },
      {
        where: { id: postId },
      }
    );
  };

  static readonly reportComment = async (
    model: ReportCommentModel
  ): Promise<void> => {
    await model.save();
  };

  static readonly commentReportCount = async (
    commentId: string
  ): Promise<number> => {
    return await ReportCommentModel.count({ where: { commentId: commentId } });
  };

  static readonly banComment = async (commentId: string): Promise<void> => {
    await CommentModel.update(
      {
        status: EntityStatus.banned,
      },
      {
        where: { id: commentId },
      }
    );
  };

  static readonly reportUser = async (
    model: ReportUserModel
  ): Promise<void> => {
    await model.save();
  };

  static readonly userReportedCount = async (
    reportedUserId: string
  ): Promise<number> => {
    return await ReportUserModel.count({
      where: { reportedUserId: reportedUserId },
    });
  };

  static readonly banUser = async (
    userId: string,
    transaction: Transaction
  ): Promise<void> => {
    await UserModel.update(
      {
        status: EntityStatus.banned,
      },
      {
        where: { id: userId },
        transaction: transaction,
      }
    );
  };
}
