import { DataTypes, Model } from "sequelize";

import Tables from "../../constants/tables.js";
import PostgresService from "../../services/postgres_service.js";
import { UserModel } from "../user/user_model.js";
import { PostModel } from "./post_model.js";
import BaseAttributes from "../base_attributes.js";

export enum EmotionType {
  like = "LIKE",
  dislike = "DISLIKE",
}

export interface ReactionAttributes extends BaseAttributes {
  userId: string;
  postId: string;
  emotionType: EmotionType;
}

export class ReactionModel extends Model<ReactionAttributes> {
  static readonly initialize = () => {
    ReactionModel.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: { type: DataTypes.UUID, allowNull: false },
        postId: { type: DataTypes.UUID, allowNull: false },
        emotionType: {
          type: DataTypes.ENUM,
          values: Object.values(EmotionType),
          allowNull: false,
        },
      },
      {
        timestamps: true,
        tableName: Tables.reactions,
        modelName: "ReactionModel",
        sequelize: PostgresService.sequelize,
        indexes: [{ fields: ["userId"] }, { fields: ["postId"] }],
      }
    );
  };

  static readonly associate = () => {
    ReactionModel.belongsTo(UserModel, {
      foreignKey: "userId",
      as: "user",
    });

    ReactionModel.belongsTo(PostModel, {
      foreignKey: "postId",
      as: "post",
    });
  };
}
