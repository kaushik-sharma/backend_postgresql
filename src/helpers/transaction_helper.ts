import { Transaction } from "sequelize";

import { PostgresService } from "../services/postgres_service.js";

export const performTransaction = async <T>(
  task: (transaction: Transaction) => Promise<T>
): Promise<T> => {
  const transaction = await PostgresService.sequelize.transaction();

  try {
    const result = await task(transaction);
    await transaction.commit();
    return result;
  } catch (error: any) {
    await transaction.rollback();
    throw error;
  }
};
