import { DataTypes, QueryInterface } from "sequelize";

import { Tables } from "../constants/tables.js";

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

    await queryInterface.addColumn(Tables.posts, "bannedAt", {
      type: DataTypes.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn(Tables.posts, "deletedAt", {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn(Tables.comments, "bannedAt", {
      type: DataTypes.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn(Tables.comments, "deletedAt", {
      type: DataTypes.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeColumn(Tables.users, "bannedAt");
    await queryInterface.removeColumn(Tables.users, "deletedAt");

    await queryInterface.removeColumn(Tables.posts, "bannedAt");
    await queryInterface.removeColumn(Tables.posts, "deletedAt");

    await queryInterface.removeColumn(Tables.comments, "bannedAt");
    await queryInterface.removeColumn(Tables.comments, "deletedAt");
  },
};
