import { Sequelize } from "sequelize";

import logger from "../utils/logger.js";

export default class PostgresService {
  static readonly connect = async (): Promise<Sequelize> => {
    const sequelize = new Sequelize(process.env.SUPABASE_CONNECTION_URI!, {
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Use `true` in production with a valid cert
        },
      },
      logging: false,
    });

    await sequelize.authenticate();

    logger.info("Connected to PostgreSQL successfully.");

    return sequelize;
  };
}
