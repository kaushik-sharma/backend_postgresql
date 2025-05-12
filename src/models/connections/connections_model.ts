import { DataTypes, Model } from "sequelize";
import BaseAttributes from "../base_attributes.js";
import { UserAttributes, UserModel } from "../user/user_model.js";
import Tables from "../../constants/tables.js";
import PostgresService from "../../services/postgres_service.js";
import { EntityStatus } from "../../constants/enums.js";

export interface ConnectionAttributes extends BaseAttributes {
  followerId: string;
  followeeId: string;

  // Associations
  follower?: UserAttributes;
  followee?: UserAttributes;
}

export class ConnectionModel extends Model<ConnectionAttributes> {
  static readonly initialize = () => {
    ConnectionModel.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        followerId: { type: DataTypes.UUID, allowNull: false },
        followeeId: { type: DataTypes.UUID, allowNull: false },
      },
      {
        timestamps: true,
        tableName: Tables.connections,
        modelName: "ConnectionModel",
        sequelize: PostgresService.sequelize,
      }
    );
  };

  static readonly associate = () => {
    ConnectionModel.belongsTo(UserModel, {
      foreignKey: "followerId",
      as: "follower",
    });
    ConnectionModel.belongsTo(UserModel, {
      foreignKey: "followeeId",
      as: "followee",
    });

    ConnectionModel.addScope("withActiveFollower", {
      include: [
        {
          model: UserModel,
          as: "follower",
          where: { status: EntityStatus.active },
          required: true,
        },
      ],
    });
    ConnectionModel.addScope("withActiveFollowee", {
      include: [
        {
          model: UserModel,
          as: "followee",
          where: { status: EntityStatus.active },
          required: true,
        },
      ],
    });
  };
}
