import { Response } from "express";

// export interface Metadata {
//   message?: string;
// }

export interface SuccessResponseHandlerParams {
  res: Response;
  status: number;
  // metadata?: Metadata;
  data?: Record<string, any>;
}

// export const requestHandler = async (
//   next: NextFunction,
//   callback: () => Promise<void>
// ): Promise<void> => {
//   try {
//     await callback();
//   } catch (error) {
//     next(error);
//   }
// };

export const successResponseHandler = ({
  res,
  status,
  // metadata,
  data,
}: SuccessResponseHandlerParams): void => {
  res.status(status).json(data);
};
