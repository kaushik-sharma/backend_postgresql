import { DataTypes, Model } from "sequelize";

import Tables from "../../constants/tables.js";
import PostgresService from "../../services/postgres_service.js";
import { UserModel } from "../user/user_model.js";
import BaseAttributes from "../base_attributes.js";
import { Platform } from "../../constants/enums.js";

export interface SessionAttributes extends BaseAttributes {
  userId: string;
  deviceId: string;
  deviceName: string;
  platform: Platform;
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
        deviceId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        deviceName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        platform: {
          type: DataTypes.ENUM,
          values: Object.values(Platform),
          allowNull: false,
        },
      },
      {
        timestamps: true,
        tableName: Tables.sessions,
        modelName: "SessionModel",
        sequelize: PostgresService.sequelize,
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
