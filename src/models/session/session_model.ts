import { DataTypes, Model } from "sequelize";

import Tables from "../../constants/tables.js";
import { SEQUELIZE } from "../../constants/values.js";
import { UserModel } from "../user/user_model.js";
import BaseAttributes from "../base_attributes.js";

export interface SessionAttributes extends BaseAttributes {
  userId: string;
}

export class SessionModel extends Model<SessionAttributes> {
  static readonly initialize = () => {
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
  };

  static readonly associate = () => {
    SessionModel.belongsTo(UserModel, {
      foreignKey: "userId",
      as: "user",
    });
  };
}
