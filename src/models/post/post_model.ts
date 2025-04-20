import { DataTypes, Model } from "sequelize";

import { EntityStatus } from "../../constants/enums.js";
import Tables from "../../constants/tables.js";
import { SEQUELIZE } from "../../constants/values.js";
import { UserModel } from "../user/user_model.js";
import { CommentModel } from "./comment_model.js";
import { ReactionModel } from "./reaction_model.js";
import { ReportPostModel } from "../moderation/report_post_model.js";

interface PostAttributes {
  id?: string;
  userId: string;
  text: string;
  imagePath: string | null;
  repostedPostId: string | null;
  status: EntityStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PostModel extends Model<PostAttributes> implements PostAttributes {
  public readonly id!: string;
  public readonly userId!: string;
  public readonly text!: string;
  public readonly imagePath!: string | null;
  public readonly repostedPostId!: string | null;
  public readonly status!: EntityStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user!: UserModel;
  public readonly likeCount!: number;
  public readonly dislikeCount!: number;
  public readonly commentCount!: number;
  public readonly repostedPost?: PostModel | null;
}

export const initPostModel = () => {
  PostModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      repostedPostId: { type: DataTypes.UUID, allowNull: true },
      text: { type: DataTypes.TEXT, allowNull: false },
      imagePath: { type: DataTypes.STRING, allowNull: true },
      status: {
        type: DataTypes.ENUM,
        values: Object.values(EntityStatus),
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: Tables.posts,
      modelName: "PostModel",
      sequelize: SEQUELIZE,
      indexes: [{ fields: ["userId"] }],
    }
  );

  PostModel.belongsTo(UserModel, { foreignKey: "userId", as: "user" });

  PostModel.belongsTo(PostModel, {
    foreignKey: "repostedPostId",
    as: "repostedPost",
  });

  PostModel.hasMany(CommentModel, {
    foreignKey: "postId",
    as: "comments",
  });

  PostModel.hasMany(ReactionModel, {
    foreignKey: "postId",
    as: "reactions",
  });

  PostModel.hasMany(ReportPostModel, {
    foreignKey: "postId",
    as: "reportedPosts",
  });
};
