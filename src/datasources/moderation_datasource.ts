import {
  ReportCommentAttributes,
  ReportCommentModel,
} from "../models/moderation/report_comment_model.js";
import {
  ReportPostAttributes,
  ReportPostModel,
} from "../models/moderation/report_post_model.js";
import {
  ReportUserAttributes,
  ReportUserModel,
} from "../models/moderation/report_user_model.js";

export default class ModerationDatasource {
  static readonly reportPost = async (
    data: ReportPostAttributes
  ): Promise<void> => {
    const model = new ReportPostModel(data);
    await model.save();
  };

  static readonly postReportCount = async (postId: string): Promise<number> => {
    return await ReportPostModel.count({ where: { postId: postId } });
  };

  static readonly reportComment = async (
    data: ReportCommentAttributes
  ): Promise<void> => {
    const model = new ReportCommentModel(data);
    await model.save();
  };

  static readonly commentReportCount = async (
    commentId: string
  ): Promise<number> => {
    return await ReportCommentModel.count({ where: { commentId: commentId } });
  };

  static readonly reportUser = async (
    data: ReportUserAttributes
  ): Promise<void> => {
    const model = new ReportUserModel(data);
    await model.save();
  };

  static readonly userReportedCount = async (
    reportedUserId: string
  ): Promise<number> => {
    return await ReportUserModel.count({
      where: { reportedUserId: reportedUserId },
    });
  };

  static readonly postReportByUserExists = async (
    userId: string,
    postId: string
  ): Promise<boolean> => {
    const count = await ReportPostModel.count({
      where: { userId, postId },
    });
    return count > 0;
  };

  static readonly commentReportByUserExists = async (
    userId: string,
    commentId: string
  ): Promise<boolean> => {
    const count = await ReportCommentModel.count({
      where: { userId, commentId },
    });
    return count > 0;
  };

  static readonly userReportByUserExists = async (
    userId: string,
    reportedUserId: string
  ): Promise<boolean> => {
    const count = await ReportUserModel.count({
      where: { userId, reportedUserId },
    });
    return count > 0;
  };
}
