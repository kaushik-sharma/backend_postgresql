import { DataTypes, QueryInterface, Sequelize } from "sequelize";

import { Tables } from "../constants/tables.js";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
    );

    await queryInterface.createTable(Tables.connections, {
      id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      followerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: Tables.users,
          key: "id",
        },
      },
      followeeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: Tables.users,
          key: "id",
        },
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

    await queryInterface.addIndex(Tables.connections, ["followerId"]);
    await queryInterface.addIndex(Tables.connections, ["followeeId"]);

    await queryInterface.addConstraint(Tables.connections, {
      fields: ["followerId", "followeeId"],
      type: "unique",
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    throw new Error("Unimplemented error!");
  },
};
