import { Sequelize } from "sequelize";

import logger from "../utils/logger.js";

let _sequelize: Sequelize | null = null;

export const getSequelize = (): Sequelize => {
  if (_sequelize === null) {
    throw new Error("Postgres is not initialized.");
  }
  return _sequelize;
};

export default class PostgresService {
  static readonly connect = async () => {
    _sequelize = new Sequelize(process.env.SUPABASE_CONNECTION_URI!, {
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Use `true` in production with a valid cert
        },
      },
      logging: false,
    });

    await _sequelize.authenticate();

    logger.info("Connected to PostgreSQL successfully.");
  };
}
