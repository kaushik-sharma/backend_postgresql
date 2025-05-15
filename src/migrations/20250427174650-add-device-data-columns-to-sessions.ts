import { DataTypes, QueryInterface } from "sequelize";

import { Tables } from "../constants/tables.js";
import { Platform } from "../constants/enums.js";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.addColumn(Tables.sessions, "deviceId", {
      type: DataTypes.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn(Tables.sessions, "deviceName", {
      type: DataTypes.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn(Tables.sessions, "platform", {
      type: DataTypes.ENUM,
      values: Object.values(Platform),
      allowNull: false,
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    throw new Error("Unimplemented error!");
  },
};
