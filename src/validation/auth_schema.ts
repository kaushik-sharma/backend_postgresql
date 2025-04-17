import { z } from "zod";

import { Gender } from "../constants/enums.js";
import { DateUtils } from "../utils/date_utils.js";
import { MIN_ACCOUNT_OPENING_AGE, MIN_DOB_DATE } from "../constants/values.js";
import {
  COUNTRY_CODE_REGEX,
  DOB_DATE_REGEX,
  PHONE_NUMBER_REGEX,
} from "../constants/regex.js";

export const emailValidation = z
  .string({ required_error: "Email is required." })
  .trim()
  .nonempty({ message: "Email must not be empty." })
  .email()
  .transform((value) => value.toLowerCase());

export const verificationCodeValidation = z
  .string({ required_error: "Verification code is required." })
  .trim()
  .nonempty({ message: "Verification code can not be empty." })
  .length(6, { message: "Verification code must be 6 characters long." })
  .regex(/^\d{6}$/, { message: "Must contain only digits." });

export const verificationTokenValidation = z
  .string({ required_error: "Verification token is required." })
  .trim()
  .nonempty({ message: "Verification token can not be empty." });

export const firstNameValidation = z
  .string({ required_error: "First name is required." })
  .trim()
  .nonempty({ message: "First name must not be empty." })
  .min(1)
  .max(50);

export const lastNameValidation = z
  .string({ required_error: "Last name is required." })
  .trim()
  .nonempty({ message: "Last name must not be empty." })
  .min(1)
  .max(50);

export const genderValidation = z.nativeEnum(Gender, {
  required_error: "Gender is required.",
});

export const dobValidation = z
  .string({ required_error: "DoB is required." })
  .trim()
  .nonempty({ message: "DoB must not be empty." })
  .regex(DOB_DATE_REGEX, {
    message: "DoB format is invalid. Expected format - 'YYYY-MM-DD'",
  })
  .refine(
    (val) => {
      const date = new Date(val);
      const now = new Date();
      const maxDate = DateUtils.subtractYearsFromDate(
        now,
        MIN_ACCOUNT_OPENING_AGE
      );
      return date <= maxDate;
    },
    {
      message: `Minimum age to open an account is ${MIN_ACCOUNT_OPENING_AGE} years.`,
    }
  )
  .refine(
    (val) => {
      const date = new Date(val);
      return date >= MIN_DOB_DATE;
    },
    {
      message: `Minimum date for DoB: ${
        MIN_DOB_DATE.toISOString().split("T")[0]
      }`,
    }
  );

export const emailSchema = z.object({
  email: emailValidation,
});

export type EmailType = z.infer<typeof emailSchema>;

export const requestEmailCodeSchema = z.object({
  email: emailValidation,
  previousToken: verificationTokenValidation.optional(),
});

export type RequestEmailCodeType = z.infer<typeof requestEmailCodeSchema>;

export const signInSchema = z.object({
  email: emailValidation,
  verificationCode: verificationCodeValidation,
  verificationToken: verificationTokenValidation,
  cancelAccountDeletionRequest: z.boolean().optional().default(false),
});

export type SignInType = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  firstName: firstNameValidation,
  lastName: lastNameValidation,
  gender: genderValidation,
  countryCode: z
    .string({ required_error: "Country code is required." })
    .trim()
    .nonempty({ message: "Country code must not be empty." })
    .regex(COUNTRY_CODE_REGEX, { message: "Country code is invalid." }),
  phoneNumber: z
    .string({ required_error: "Phone number is required." })
    .trim()
    .nonempty({ message: "Phone number must not be empty." })
    .regex(PHONE_NUMBER_REGEX, { message: "Phone number is invalid." }),
  dob: dobValidation,
  email: emailValidation,
  verificationCode: verificationCodeValidation,
  verificationToken: verificationTokenValidation,
});

export type SignUpType = z.infer<typeof signUpSchema>;
