import { DataTypes, Model } from "sequelize";

import { ReportReason } from "../../constants/enums.js";
import Tables from "../../constants/tables.js";
import PostgresService from "../../services/postgres_service.js";
import { UserModel } from "../user/user_model.js";
import BaseAttributes from "../base_attributes.js";

export interface ReportUserAttributes extends BaseAttributes {
  reportedUserId: string;
  userId: string;
  reason: ReportReason;
}

export class ReportUserModel extends Model<ReportUserAttributes> {
  static readonly initialize = () => {
    ReportUserModel.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        reportedUserId: {
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
        tableName: Tables.reportedUsers,
        modelName: "ReportUserModel",
        sequelize: PostgresService.sequelize,
        indexes: [{ fields: ["reportedUserId"] }, { fields: ["userId"] }],
      }
    );
  };

  static readonly associate = () => {
    ReportUserModel.belongsTo(UserModel, { foreignKey: "userId", as: "user" });

    ReportUserModel.belongsTo(UserModel, {
      foreignKey: "reportedUserId",
      as: "reportedUser",
    });
  };
}
