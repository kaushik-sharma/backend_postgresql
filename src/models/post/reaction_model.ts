import { DataTypes, Model } from "sequelize";

import Tables from "../../constants/tables.js";
import { SEQUELIZE } from "../../constants/values.js";
import { UserModel } from "../user/user_model.js";
import { PostModel } from "./post_model.js";

export enum EmotionType {
  like = "LIKE",
  dislike = "DISLIKE",
}

interface ReactionAttributes {
  id?: string;
  userId: string;
  postId: string;
  emotionType: EmotionType;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ReactionModel
  extends Model<ReactionAttributes>
  implements ReactionAttributes
{
  public readonly id!: string;
  public readonly userId!: string;
  public readonly postId!: string;
  public readonly emotionType!: EmotionType;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initReactionModel = () => {
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
      sequelize: SEQUELIZE,
      indexes: [{ fields: ["userId"] }, { fields: ["postId"] }],
    }
  );
};

export const associateReactionModel = () => {
  ReactionModel.belongsTo(UserModel, {
    foreignKey: "userId",
    as: "user",
  });

  ReactionModel.belongsTo(PostModel, {
    foreignKey: "postId",
    as: "post",
  });
};
