import { DataTypes, Model } from "sequelize";

import Tables from "../../constants/tables.js";
import { getSequelize } from "../../services/postgres_service.js";

interface UserDeletionRequestAttributes {
  id?: string;
  userId: string;
  deleteAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserDeletionRequestModel
  extends Model<UserDeletionRequestAttributes>
  implements UserDeletionRequestAttributes
{
  public readonly id!: string;
  public readonly userId!: string;
  public readonly deleteAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initUserDeletionRequestModel = () => {
  UserDeletionRequestModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      deleteAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      timestamps: true,
      tableName: Tables.userDeletionRequests,
      modelName: "UserDeletionRequestModel",
      sequelize: getSequelize(),
      indexes: [{ fields: ["userId"] }, { fields: ["deleteAt"] }],
    }
  );
};
