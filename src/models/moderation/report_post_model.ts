import { DataTypes, Model } from "sequelize";

import { ReportReason } from "../../constants/enums.js";
import Tables from "../../constants/tables.js";
import PostgresService from "../../services/postgres_service.js";
import { UserModel } from "../user/user_model.js";
import { PostModel } from "../post/post_model.js";
import BaseAttributes from "../base_attributes.js";

export interface ReportPostAttributes extends BaseAttributes {
  postId: string;
  userId: string;
  reason: ReportReason;
}

export class ReportPostModel extends Model<ReportPostAttributes> {
  static readonly initialize = () => {
    ReportPostModel.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        postId: {
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
        tableName: Tables.reportedPosts,
        modelName: "ReportPostModel",
        sequelize: PostgresService.sequelize,
      }
    );
  };

  static readonly associate = () => {
    ReportPostModel.belongsTo(UserModel, { foreignKey: "userId", as: "user" });

    ReportPostModel.belongsTo(PostModel, { foreignKey: "postId", as: "post" });
  };
}
