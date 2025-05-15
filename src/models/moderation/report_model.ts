import { DataTypes, Model } from "sequelize";
import { ReportReason, ReportTargetType } from "../../constants/enums.js";
import { BaseAttributes } from "../base_attributes.js";
import { Tables } from "../../constants/tables.js";
import { PostgresService } from "../../services/postgres_service.js";
import { UserModel } from "../user/user_model.js";

export interface ReportAttributes extends BaseAttributes {
  targetType: ReportTargetType;
  targetId: string;
  reporterId: string;
  reason: ReportReason;
}

export class ReportModel extends Model<ReportAttributes> {
  static readonly initialize = () => {
    ReportModel.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        targetType: {
          type: DataTypes.ENUM,
          values: Object.values(ReportTargetType),
          allowNull: false,
        },
        targetId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        reporterId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        reason: {
          type: DataTypes.ENUM,
          values: Object.values(ReportReason),
          allowNull: false,
        },
      },
      {
        timestamps: true,
        tableName: Tables.reports,
        modelName: "ReportModel",
        sequelize: PostgresService.sequelize,
      }
    );
  };

  static readonly associate = () => {
    ReportModel.belongsTo(UserModel, {
      foreignKey: "reporterId",
      as: "reporter",
    });
  };
}
