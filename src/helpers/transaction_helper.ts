import { Transaction } from "sequelize";

import { SEQUELIZE } from "../constants/values.js";

export const performTransaction = async <T>(
  task: (transaction: Transaction) => Promise<T>
): Promise<T> => {
  const transaction = await SEQUELIZE.transaction();

  try {
    const result = await task(transaction);
    await transaction.commit();
    return result;
  } catch (error: any) {
    await transaction.rollback();
    throw error;
  }
};
