import { DataTypes, Model } from "sequelize";

import { EntityStatus, Gender } from "../../constants/enums.js";
import Tables from "../../constants/tables.js";
import { getSequelize } from "../../services/postgres_service.js";

interface UserAttributes {
  id?: string;
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  countryCode?: string;
  phoneNumber?: string;
  email?: string;
  dob?: string;
  profileImagePath?: string | null;
  status: EntityStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserModel extends Model<UserAttributes> implements UserAttributes {
  public readonly id!: string;
  public readonly firstName?: string;
  public readonly lastName?: string;
  public readonly gender?: Gender;
  public readonly countryCode?: string;
  public readonly phoneNumber?: string;
  public readonly email?: string;
  public readonly dob?: string;
  public readonly profileImagePath?: string | null;
  public readonly status!: EntityStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initUserModel = () => {
  UserModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      firstName: { type: DataTypes.STRING, allowNull: true },
      lastName: { type: DataTypes.STRING, allowNull: true },
      gender: { type: DataTypes.STRING, allowNull: true },
      countryCode: { type: DataTypes.STRING, allowNull: true },
      phoneNumber: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      dob: { type: DataTypes.STRING, allowNull: true },
      profileImagePath: { type: DataTypes.STRING, allowNull: true },
      status: { type: DataTypes.STRING, allowNull: false },
    },
    {
      timestamps: true,
      tableName: Tables.users,
      modelName: "UserModel",
      sequelize: getSequelize(),
      indexes: [
        { fields: ["email"] },
        { fields: ["countryCode"] },
        { fields: ["phoneNumber"] },
      ],
    }
  );

  UserModel.beforeSave((user: UserModel) => {
    if (user.status === EntityStatus.active) {
      user.setDataValue("profileImagePath", null);
    }
  });
};
