import { DataTypes, QueryInterface, Sequelize } from "sequelize";

import { Tables } from "../constants/tables.js";
import { ReportTargetType, ReportReason } from "../constants/enums.js";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
    );

    await queryInterface.createTable(Tables.reports, {
      id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      targetType: {
        type: DataTypes.ENUM,
        values: Object.values(ReportTargetType),
        allowNull: false,
      },
      targetId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      reporterId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: Tables.users,
          key: "id",
        },
      },
      reason: {
        type: DataTypes.ENUM,
        values: Object.values(ReportReason),
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

    await queryInterface.addIndex(Tables.reports, ["targetType"]);
    await queryInterface.addIndex(Tables.reports, ["targetId"]);
    await queryInterface.addIndex(Tables.reports, ["reporterId"]);

    await queryInterface.addConstraint(Tables.reports, {
      fields: ["targetId", "reporterId"],
      type: "unique",
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    throw new Error("Unimplemented error!");
  },
};
