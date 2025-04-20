import { DataTypes, Model } from "sequelize";

import Tables from "../../constants/tables.js";
import { SEQUELIZE } from "../../constants/values.js";
import { UserModel } from "../user/user_model.js";

interface SessionAttributes {
  id?: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SessionModel
  extends Model<SessionAttributes>
  implements SessionAttributes
{
  public readonly id!: string;
  public readonly userId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initSessionModel = () => {
  SessionModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: Tables.sessions,
      modelName: "SessionModel",
      sequelize: SEQUELIZE,
      indexes: [{ fields: ["userId"] }],
    }
  );

  SessionModel.belongsTo(UserModel, {
    foreignKey: "userId",
    as: "user",
  });
};
