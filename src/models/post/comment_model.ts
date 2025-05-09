import { DataTypes, Model } from "sequelize";

import { EntityStatus } from "../../constants/enums.js";
import Tables from "../../constants/tables.js";
import PostgresService from "../../services/postgres_service.js";
import { UserAttributes, UserModel } from "../user/user_model.js";
import { PostModel } from "./post_model.js";
import { ReportCommentModel } from "../moderation/report_comment_model.js";
import BaseAttributes from "../base_attributes.js";

export interface CommentAttributes extends BaseAttributes {
  postId: string;
  userId: string;
  parentCommentId: string | null;
  level: number;
  text: string;
  status: EntityStatus;
  bannedAt?: Date | null;
  deletedAt?: Date | null;

  // Associations
  user?: UserAttributes;
}

export class CommentModel extends Model<CommentAttributes> {
  static readonly initialize = () => {
    CommentModel.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        postId: { type: DataTypes.UUID, allowNull: false },
        userId: { type: DataTypes.UUID, allowNull: false },
        parentCommentId: { type: DataTypes.UUID, allowNull: true },
        level: { type: DataTypes.INTEGER, allowNull: false },
        text: { type: DataTypes.TEXT, allowNull: false },
        status: {
          type: DataTypes.ENUM,
          values: Object.values(EntityStatus),
          allowNull: false,
        },
        bannedAt: { type: DataTypes.DATE, allowNull: true },
        deletedAt: { type: DataTypes.DATE, allowNull: true },
      },
      {
        timestamps: true,
        tableName: Tables.comments,
        modelName: "CommentModel",
        sequelize: PostgresService.sequelize,
        indexes: [
          { fields: ["postId"] },
          { fields: ["userId"] },
          { fields: ["status"] },
        ],
      }
    );
  };

  static readonly associate = () => {
    CommentModel.belongsTo(UserModel, { foreignKey: "userId", as: "user" });

    CommentModel.belongsTo(PostModel, { foreignKey: "postId", as: "post" });

    CommentModel.hasMany(ReportCommentModel, {
      foreignKey: "commentId",
      as: "reportedComments",
    });
  };
}
