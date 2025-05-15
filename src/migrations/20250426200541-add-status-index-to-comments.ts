import { QueryInterface } from "sequelize";

import { Tables } from "../constants/tables.js";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.addIndex(Tables.comments, ["status"]);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    throw new Error("Unimplemented error!");
  },
};
