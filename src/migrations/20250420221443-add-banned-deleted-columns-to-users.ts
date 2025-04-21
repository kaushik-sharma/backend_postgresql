import { DataTypes, QueryInterface } from "sequelize";

import Tables from "../constants/tables.js";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.addColumn(Tables.users, "bannedAt", {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn(Tables.users, "deletedAt", {
      type: DataTypes.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeColumn(Tables.users, "bannedAt");
    await queryInterface.removeColumn(Tables.users, "deletedAt");
  },
};
