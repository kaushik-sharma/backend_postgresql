import { DataTypes, QueryInterface, Sequelize } from "sequelize";

import Tables from "../constants/tables.js";
import { ReportReason } from "../constants/enums.js";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
    );

    await queryInterface.createTable(Tables.reportedPosts, {
      id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      postId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: Tables.posts,
          key: "id",
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: Tables.users,
          key: "id",
        },
      },
      reason: {
        type: DataTypes.ENUM,
        allowNull: false,
        values: Object.values(ReportReason),
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

    await queryInterface.addIndex(Tables.reportedPosts, ["postId"]);
    await queryInterface.addIndex(Tables.reportedPosts, ["userId"]);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    throw new Error("Unimplemented error!");
  },
};
