import { Document } from "mongoose";

import { CustomError } from "../middlewares/error_middlewares.js";

export function validateModel<T extends Document>(model: T): void {
  const error = model.validateSync();
  if (error === undefined || error === null) return;

  const errors = Object.values(error.errors);
  if (errors.length === 0) return;

  throw new CustomError(422, errors[0].message);
}

// export async function validateModelAsync<T extends Document>(model: T): Promise<void> {
//   try {
//     await model.validate();
//   } catch (error: any) {
//     if (!(error instanceof mongoose.Error.ValidationError)) return;
//     const errors = Object.values(error.errors);
//     if (errors.length > 0) {
//       throw new Error(errors[0].message);
//     }
//   }
// }
