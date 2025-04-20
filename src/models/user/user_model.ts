import { DataTypes, Model } from "sequelize";

import { EntityStatus, Gender } from "../../constants/enums.js";
import Tables from "../../constants/tables.js";
import { SEQUELIZE } from "../../constants/values.js";
import { SessionModel } from "../session/session_model.js";
import { UserDeletionRequestModel } from "../profile/user_deletion_request_model.js";
import { PostModel } from "../post/post_model.js";
import { CommentModel } from "../post/comment_model.js";
import { ReactionModel } from "../post/reaction_model.js";
import { ReportPostModel } from "../moderation/report_post_model.js";
import { ReportCommentModel } from "../moderation/report_comment_model.js";
import { ReportUserModel } from "../moderation/report_user_model.js";

interface UserAttributes {
  id?: string;
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  countryCode?: string;
  phoneNumber?: string;
  email?: string;
  dob?: string;
  profileImagePath?: string | null;
  status: EntityStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserModel extends Model<UserAttributes> implements UserAttributes {
  public readonly id!: string;
  public readonly firstName?: string;
  public readonly lastName?: string;
  public readonly gender?: Gender;
  public readonly countryCode?: string;
  public readonly phoneNumber?: string;
  public readonly email?: string;
  public readonly dob?: string;
  public readonly profileImagePath?: string | null;
  public readonly status!: EntityStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initUserModel = () => {
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
      ],
    }
  );

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

  UserModel.beforeSave((user: UserModel) => {
    if (user.status === EntityStatus.active) {
      user.setDataValue("profileImagePath", null);
    }
  });
};
