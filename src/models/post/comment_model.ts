import { DataTypes, Model } from "sequelize";

import { EntityStatus } from "../../constants/enums.js";
import Tables from "../../constants/tables.js";
import { SEQUELIZE } from "../../constants/values.js";
import { UserModel } from "../user/user_model.js";
import { PostModel } from "./post_model.js";
import { ReportCommentModel } from "../moderation/report_comment_model.js";

interface CommentAttributes {
  id?: string;
  postId: string;
  userId: string;
  parentCommentId: string | null;
  level: number;
  text: string;
  status: EntityStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CommentModel
  extends Model<CommentAttributes>
  implements CommentAttributes
{
  public readonly id!: string;
  public readonly postId!: string;
  public readonly userId!: string;
  public readonly parentCommentId!: string | null;
  public readonly level!: number;
  public readonly text!: string;
  public readonly status!: EntityStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user!: UserModel;
}

export const initCommentModel = () => {
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
    },
    {
      timestamps: true,
      tableName: Tables.comments,
      modelName: "CommentModel",
      sequelize: SEQUELIZE,
      indexes: [{ fields: ["postId"] }, { fields: ["userId"] }],
    }
  );

  CommentModel.belongsTo(UserModel, { foreignKey: "userId", as: "user" });

  CommentModel.belongsTo(PostModel, { foreignKey: "postId", as: "post" });

  CommentModel.hasMany(ReportCommentModel, {
    foreignKey: "commentId",
    as: "reportedComments",
  });
};
