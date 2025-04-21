import { DataTypes, Model } from "sequelize";

import Tables from "../../constants/tables.js";
import { SEQUELIZE } from "../../constants/values.js";
import { UserModel } from "../user/user_model.js";
import BaseAttributes from "../base_attributes.js";

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
        sequelize: SEQUELIZE,
        indexes: [{ fields: ["userId"] }, { fields: ["deleteAt"] }],
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
