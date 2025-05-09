import fs from "fs";
import pg from "pg";
import { Sequelize } from "sequelize";

import logger from "../utils/logger.js";

export default class PostgresService {
  static #sequelize: Sequelize;

  static get sequelize(): Sequelize {
    if (!this.#sequelize) {
      throw new Error("Postgres not connected. Call connect() first.");
    }
    return this.#sequelize;
  }

  static readonly connect = async (): Promise<void> => {
    const caCert = fs.readFileSync(
      process.env.SUPABASE_DB_SSL_CERT_FILE_NAME!,
      "utf8"
    );

    const sequelize = new Sequelize(process.env.SUPABASE_CONNECTION_URI!, {
      dialect: "postgres",
      // ── Native Bindings ─────────────────────────────────────────────────
      dialectModule: pg,
      native: true,
      // ── SSL ──────────────────────────────────────────────────────────────
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: true,
          ca: caCert,
        },
      },
      // ── Pooling ───────────────────────────────────────────────────────────
      pool: {
        max: 20,
        min: 2,
        acquire: 30000,
        idle: 10000,
        evict: 1000,
      },
      // ── Global Model Definition ──────────────────────────────────────────
      define: {
        freezeTableName: true,
        timestamps: true,
      },
      // ── Timezone ──────────────────────────────────────────────────────────
      timezone: "UTC",
      // ── Logging ───────────────────────────────────────────────────────────
      logging: false,
      // ── Retry Logic ───────────────────────────────────────────────────────
      retry: {
        max: 3,
      },
    });

    await sequelize.authenticate();

    logger.info("Connected to PostgreSQL successfully.");

    this.#sequelize = sequelize;
  };
}
