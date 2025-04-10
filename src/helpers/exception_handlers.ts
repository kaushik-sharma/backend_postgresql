import { Request, Response, NextFunction, RequestHandler } from "express";

export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      return await Promise.resolve(fn(req, res, next));
    } catch (err: any) {
      next(err);
    }
  };
};
