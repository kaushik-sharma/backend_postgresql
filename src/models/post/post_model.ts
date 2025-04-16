import { DataTypes, Model } from "sequelize";

import { EntityStatus } from "../../constants/enums.js";
import Tables from "../../constants/tables.js";
import { getSequelize } from "../../services/postgres_service.js";
import { UserModel } from "../auth/user_model.js";

interface PostAttributes {
  id?: string;
  userId: string;
  text: string;
  imagePath: string | null;
  repostedPostId: string | null;
  status: EntityStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PostModel extends Model<PostAttributes> implements PostAttributes {
  public readonly id!: string;
  public readonly userId!: string;
  public readonly text!: string;
  public readonly imagePath!: string | null;
  public readonly repostedPostId!: string | null;
  public readonly status!: EntityStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user!: UserModel;
  public readonly likeCount!: number;
  public readonly dislikeCount!: number;
  public readonly commentCount!: number;
  public readonly repostedPost?: PostModel | null;

  static associate() {
    PostModel.belongsTo(UserModel, { foreignKey: "userId", as: "user" });
    PostModel.belongsTo(PostModel, {
      foreignKey: "repostedPostId",
      as: "repostedPost",
    });
  }
}

export const initPostModel = () => {
  PostModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      text: { type: DataTypes.STRING, allowNull: false },
      imagePath: { type: DataTypes.STRING, allowNull: true },
      repostedPostId: { type: DataTypes.UUID, allowNull: true },
      status: { type: DataTypes.STRING, allowNull: false },
    },
    {
      timestamps: true,
      tableName: Tables.posts,
      modelName: "PostModel",
      sequelize: getSequelize(),
      indexes: [{ fields: ["userId"] }],
    }
  );

  PostModel.associate();
};
