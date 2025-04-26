import { DataTypes, Model } from "sequelize";

import { EntityStatus } from "../../constants/enums.js";
import Tables from "../../constants/tables.js";
import { SEQUELIZE } from "../../constants/values.js";
import { UserAttributes, UserModel } from "../user/user_model.js";
import { CommentModel } from "./comment_model.js";
import { ReactionModel } from "./reaction_model.js";
import { ReportPostModel } from "../moderation/report_post_model.js";
import BaseAttributes from "../base_attributes.js";

export interface PostAttributes extends BaseAttributes {
  userId: string;
  text: string;
  imagePath: string | null;
  repostedPostId: string | null;
  status: EntityStatus;

  // Associations
  user?: UserAttributes;
  repostedPost?: PostAttributes | null;
  likeCount?: number;
  dislikeCount?: number;
  commentCount?: number;
}

export class PostModel extends Model<PostAttributes> {
  static readonly initialize = () => {
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
        indexes: [{ fields: ["userId"] }, { fields: ["status"] }],
      }
    );
  };

  static readonly associate = () => {
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
}
