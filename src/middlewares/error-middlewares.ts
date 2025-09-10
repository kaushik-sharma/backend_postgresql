import { ErrorRequestHandler } from "express";

import logger from "../utils/logger.js";

export class CustomError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error(err);
  res.status(err.statusCode ?? 500).json({ message: err.message });
};
