import { DataTypes, Model } from "sequelize";

import { Tables } from "../../constants/tables.js";
import { PostgresService } from "../../services/postgres_service.js";
import { UserModel } from "./user_model.js";
import { BaseAttributes } from "../base_attributes.js";

export interface UserDeletionRequestAttributes extends BaseAttributes {
  userId: string;
  deleteAt: Date;
}

export class UserDeletionRequestModel extends Model<UserDeletionRequestAttributes> {
  static readonly initialize = () => {
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
        sequelize: PostgresService.sequelize,
      }
    );
  };

  static readonly associate = () => {
    UserDeletionRequestModel.belongsTo(UserModel, {
      foreignKey: "userId",
      as: "user",
    });
  };
}
