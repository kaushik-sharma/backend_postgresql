import { PrismaClient } from "../generated/prisma/index.js";
import logger from "../utils/logger.js";

export class PrismaService {
  static #client: PrismaClient | null = null;

  static get client(): PrismaClient {
    if (!this.#client) {
      throw new Error("Supabase not connected. Call connect() first.");
    }
    return this.#client;
  }

  static readonly connect = async () => {
    if (this.#client) return;

    this.#client = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL!,
        },
      },
    });
    await this.#client.$connect();
    logger.info("Connected to Supabase successfully.");
  };
}
