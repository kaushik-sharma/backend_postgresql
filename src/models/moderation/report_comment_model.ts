import { DataTypes, Model } from "sequelize";

import { ReportReason } from "../../constants/enums.js";
import Tables from "../../constants/tables.js";
import { getSequelize } from "../../services/postgres_service.js";

interface ReportCommentAttributes {
  id?: string;
  commentId: string;
  userId: string;
  reason: ReportReason;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ReportCommentModel
  extends Model<ReportCommentAttributes>
  implements ReportCommentAttributes
{
  public readonly id!: string;
  public readonly commentId!: string;
  public readonly userId!: string;
  public readonly reason!: ReportReason;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initReportCommentModel = () => {
  ReportCommentModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      commentId: {
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
      },
    },
    {
      timestamps: true,
      tableName: Tables.reportedComments,
      modelName: "ReportCommentModel",
      sequelize: getSequelize(),
      indexes: [{ fields: ["commentId"] }, { fields: ["userId"] }],
    }
  );
};
