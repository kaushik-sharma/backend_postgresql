import { DataTypes, QueryInterface, Sequelize } from "sequelize";

import { Tables } from "../constants/tables.js";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
    );

    await queryInterface.createTable(Tables.userDeletionRequests, {
      id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: Tables.users,
          key: "id",
        },
      },
      deleteAt: { type: DataTypes.DATE, allowNull: false },
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

    await queryInterface.addIndex(Tables.userDeletionRequests, ["userId"]);
    await queryInterface.addIndex(Tables.userDeletionRequests, ["deleteAt"]);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    throw new Error("Unimplemented error!");
  },
};
