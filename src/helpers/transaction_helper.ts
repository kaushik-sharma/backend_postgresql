import { Transaction } from "sequelize";
import { getSequelize } from "../services/postgres_service.js";

export const performTransaction = async <T>(
  task: (transaction: Transaction) => Promise<T>
): Promise<T> => {
  const sequelize = getSequelize();
  const transaction = await sequelize.transaction();

  try {
    const result = await task(transaction);
    await transaction.commit();
    return result;
  } catch (error: any) {
    await transaction.rollback();
    throw error;
  }
};
