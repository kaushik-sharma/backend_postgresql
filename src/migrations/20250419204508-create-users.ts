import { QueryInterface, DataTypes, Sequelize } from "sequelize";

import { Gender, EntityStatus } from "../constants/enums.js";
import Tables from "../constants/tables.js";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
    );

    await queryInterface.createTable(Tables.users, {
      id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      firstName: { type: DataTypes.STRING, allowNull: true },
      lastName: { type: DataTypes.STRING, allowNull: true },
      gender: {
        type: DataTypes.ENUM,
        values: Object.values(Gender),
        allowNull: true,
      },
      countryCode: { type: DataTypes.STRING, allowNull: true },
      phoneNumber: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      dob: { type: DataTypes.STRING, allowNull: true },
      profileImagePath: { type: DataTypes.STRING, allowNull: true },
      status: {
        type: DataTypes.ENUM,
        values: Object.values(EntityStatus),
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.addIndex(Tables.users, ["email"]);
    await queryInterface.addIndex(Tables.users, ["countryCode"]);
    await queryInterface.addIndex(Tables.users, ["phoneNumber"]);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    throw new Error("Unimplemented error!");
  },
};
