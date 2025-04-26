import { DataTypes, Model } from "sequelize";

import { EntityStatus, Gender } from "../../constants/enums.js";
import Tables from "../../constants/tables.js";
import { SEQUELIZE } from "../../constants/values.js";
import { SessionModel } from "../session/session_model.js";
import { UserDeletionRequestModel } from "./user_deletion_request_model.js";
import { PostModel } from "../post/post_model.js";
import { CommentModel } from "../post/comment_model.js";
import { ReactionModel } from "../post/reaction_model.js";
import { ReportPostModel } from "../moderation/report_post_model.js";
import { ReportCommentModel } from "../moderation/report_comment_model.js";
import { ReportUserModel } from "../moderation/report_user_model.js";
import BaseAttributes from "../base_attributes.js";

export interface UserAttributes extends BaseAttributes {
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  countryCode?: string;
  phoneNumber?: string;
  email?: string;
  dob?: string;
  profileImagePath?: string | null;
  status: EntityStatus;
  bannedAt?: Date | null;
  deletedAt?: Date | null;
}

export class UserModel extends Model<UserAttributes> {
  static readonly initialize = () => {
    UserModel.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        firstName: { type: DataTypes.STRING(50), allowNull: true },
        lastName: { type: DataTypes.STRING(50), allowNull: true },
        gender: {
          type: DataTypes.ENUM,
          values: Object.values(Gender),
          allowNull: true,
        },
        countryCode: { type: DataTypes.STRING(4), allowNull: true },
        phoneNumber: { type: DataTypes.STRING(10), allowNull: true },
        email: { type: DataTypes.STRING, allowNull: true },
        dob: { type: DataTypes.STRING, allowNull: true },
        profileImagePath: { type: DataTypes.STRING, allowNull: true },
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
        tableName: Tables.users,
        modelName: "UserModel",
        sequelize: SEQUELIZE,
        indexes: [
          { fields: ["email"] },
          { fields: ["countryCode"] },
          { fields: ["phoneNumber"] },
          { fields: ["status"] },
        ],
      }
    );

    // UserModel.beforeSave((user: UserModel) => {
    //   if (user.toJSON().status === EntityStatus.active) {
    //     user.setDataValue("profileImagePath", null);
    //     user.setDataValue("bannedAt", null);
    //     user.setDataValue("deletedAt", null);
    //   }
    // });
  };

  static readonly associate = () => {
    UserModel.hasMany(SessionModel, {
      foreignKey: "userId",
      as: "sessions",
    });

    UserModel.hasOne(UserDeletionRequestModel, {
      foreignKey: "userId",
      as: "deletionRequest",
    });

    UserModel.hasMany(PostModel, {
      foreignKey: "userId",
      as: "posts",
    });

    UserModel.hasMany(CommentModel, {
      foreignKey: "userId",
      as: "comments",
    });

    UserModel.hasMany(ReactionModel, {
      foreignKey: "userId",
      as: "reactions",
    });

    UserModel.hasMany(ReportPostModel, {
      foreignKey: "userId",
      as: "reportedPosts",
    });

    UserModel.hasMany(ReportCommentModel, {
      foreignKey: "userId",
      as: "reportedComments",
    });

    UserModel.hasMany(ReportUserModel, {
      foreignKey: "userId",
      as: "reportedUsers",
    });
  };
}
