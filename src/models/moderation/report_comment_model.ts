import { DataTypes, Model } from "sequelize";

import { ReportReason } from "../../constants/enums.js";
import Tables from "../../constants/tables.js";
import { SEQUELIZE } from "../../constants/values.js";
import { UserModel } from "../user/user_model.js";
import { CommentModel } from "../post/comment_model.js";
import BaseAttributes from "../base_attributes.js";

export interface ReportCommentAttributes extends BaseAttributes {
  commentId: string;
  userId: string;
  reason: ReportReason;
}

export class ReportCommentModel extends Model<ReportCommentAttributes> {
  static readonly initialize = () => {
    ReportCommentModel.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        commentId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        reason: {
          type: DataTypes.ENUM,
          allowNull: false,
          values: Object.values(ReportReason),
        },
      },
      {
        timestamps: true,
        tableName: Tables.reportedComments,
        modelName: "ReportCommentModel",
        sequelize: SEQUELIZE,
        indexes: [{ fields: ["commentId"] }, { fields: ["userId"] }],
      }
    );
  };

  static readonly associate = () => {
    ReportCommentModel.belongsTo(UserModel, {
      foreignKey: "userId",
      as: "user",
    });

    ReportCommentModel.belongsTo(CommentModel, {
      foreignKey: "commentId",
      as: "comment",
    });
  };
}
