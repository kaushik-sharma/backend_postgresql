import { ZodSchema } from "zod";

import logger from "../utils/logger.js";
import { CustomError } from "../middlewares/error_middlewares.js";

export function validateData<T>(schema: ZodSchema<T>, data: any): T {
  try {
    return schema.parse(data);
  } catch (err: any) {
    logger.error(err);
    const parsedError = JSON.parse(err.message) as Record<string, any>[];
    const errorMessage = parsedError[0].message as string;
    throw new CustomError(422, errorMessage);
  }
}
