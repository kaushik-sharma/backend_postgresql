import { DataTypes, QueryInterface } from "sequelize";

import { Tables } from "../constants/tables.js";
import { ReportStatus } from "../constants/enums.js";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    queryInterface.addColumn(Tables.reports, "status", {
      type: DataTypes.ENUM,
      values: Object.values(ReportStatus),
      allowNull: false,
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    throw new Error("Unimplemented error!");
  },
};
