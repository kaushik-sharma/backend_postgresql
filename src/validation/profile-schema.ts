import { z } from "zod";

import {
  dobValidation,
  firstNameValidation,
  genderValidation,
  lastNameValidation,
} from "./auth-schema.js";

export const updateProfileSchema = z
  .object({
    firstName: firstNameValidation,
    lastName: lastNameValidation,
    gender: genderValidation,
    dob: dobValidation,
  })
  .partial()
  .default({});

export type UpdateProfileType = z.infer<typeof updateProfileSchema>;
