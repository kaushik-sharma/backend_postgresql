import { DataTypes, Model } from "sequelize";

import Tables from "../../constants/tables.js";
import { SEQUELIZE } from "../../constants/values.js";
import { UserModel } from "../user/user_model.js";

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
      userId: { type: DataTypes.UUID, allowNull: false, unique: true },
      deleteAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      timestamps: true,
      tableName: Tables.userDeletionRequests,
      modelName: "UserDeletionRequestModel",
      sequelize: SEQUELIZE,
      indexes: [{ fields: ["userId"] }, { fields: ["deleteAt"] }],
    }
  );

  UserDeletionRequestModel.belongsTo(UserModel, {
    foreignKey: "userId",
    as: "user",
  });
};
