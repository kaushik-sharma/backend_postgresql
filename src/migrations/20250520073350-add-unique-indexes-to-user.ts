import { QueryInterface } from "sequelize";

import { Tables } from "../constants/tables.js";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.addConstraint(Tables.users, {
      fields: ["email"],
      type: "unique",
    });
    await queryInterface.addConstraint(Tables.users, {
      fields: ["countryCode", "phoneNumber"],
      type: "unique",
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    throw new Error("Unimplemented error!");
  },
};
