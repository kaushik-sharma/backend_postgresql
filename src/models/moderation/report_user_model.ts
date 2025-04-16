import { DataTypes, Model } from "sequelize";

import { ReportReason } from "../../constants/enums.js";
import Tables from "../../constants/tables.js";
import { getSequelize } from "../../services/postgres_service.js";

interface ReportUserAttributes {
  id?: string;
  reportedUserId: string;
  userId: string;
  reason: ReportReason;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ReportUserModel
  extends Model<ReportUserAttributes>
  implements ReportUserAttributes
{
  public readonly id!: string;
  public readonly reportedUserId!: string;
  public readonly userId!: string;
  public readonly reason!: ReportReason;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initReportUserModel = () => {
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
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: Tables.reportedUsers,
      modelName: "ReportUserModel",
      sequelize: getSequelize(),
      indexes: [{ fields: ["reportedUserId"] }, { fields: ["userId"] }],
    }
  );
};
