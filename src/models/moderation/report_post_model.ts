import { DataTypes, Model } from "sequelize";

import { ReportReason } from "../../constants/enums.js";
import Tables from "../../constants/tables.js";
import { getSequelize } from "../../services/postgres_service.js";

interface ReportPostAttributes {
  id?: string;
  postId: string;
  userId: string;
  reason: ReportReason;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ReportPostModel
  extends Model<ReportPostAttributes>
  implements ReportPostAttributes
{
  public readonly id!: string;
  public readonly postId!: string;
  public readonly userId!: string;
  public readonly reason!: ReportReason;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initReportPostModel = () => {
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
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: Tables.reportedPosts,
      modelName: "ReportPostModel",
      sequelize: getSequelize(),
      indexes: [{ fields: ["postId"] }, { fields: ["userId"] }],
    }
  );
};
