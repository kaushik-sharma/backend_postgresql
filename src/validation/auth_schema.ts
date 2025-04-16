import { z } from "zod";

import { Gender } from "../constants/enums.js";
import { DateUtils } from "../utils/date_utils.js";
import { MIN_ACCOUNT_OPENING_AGE, MIN_DOB_DATE } from "../constants/values.js";
import {
  COUNTRY_CODE_REGEX,
  DOB_DATE_REGEX,
  PHONE_NUMBER_REGEX,
} from "../constants/regex.js";

const countryCodeValidation = z
  .string({ required_error: "Country code is required." })
  .trim()
  .nonempty({ message: "Country code must not be empty." })
  .regex(COUNTRY_CODE_REGEX, { message: "Country code is invalid." });

const phoneNumberValidation = z
  .string({ required_error: "Phone number is required." })
  .trim()
  .nonempty({ message: "Phone number must not be empty." })
  .regex(PHONE_NUMBER_REGEX, { message: "Phone number is invalid." });

const passwordValidation = z
  .string({ required_error: "Password is required." })
  .trim()
  .nonempty({ message: "Password must not be empty." })
  .min(8, { message: "Password must be at least 8 characters long." })
  .max(256, { message: "Password must be less than 256 characters long." });

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

export const genderValidation = z.nativeEnum(Gender);

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
      message: `Minimum date for DoB: ${MIN_DOB_DATE.toISOString().split("T")[0]}`,
    }
  );

export const phoneNumberSchema = z.object({
  countryCode: countryCodeValidation,
  phoneNumber: phoneNumberValidation,
});

export type PhoneNumberType = z.infer<typeof phoneNumberSchema>;

export const signInSchema = z.object({
  countryCode: countryCodeValidation,
  phoneNumber: phoneNumberValidation,
  password: passwordValidation,
  cancelAccountDeletionRequest: z.boolean().optional().default(false),
});

export type SignInType = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  firstName: firstNameValidation,
  lastName: lastNameValidation,
  gender: genderValidation,
  countryCode: countryCodeValidation,
  phoneNumber: phoneNumberValidation,
  password: passwordValidation,
  email: z
    .string({ required_error: "Email is required." })
    .trim()
    .nonempty({ message: "Email must not be empty." })
    .email()
    .transform((value) => value.toLowerCase()),
  dob: dobValidation,
});

export type SignUpType = z.infer<typeof signUpSchema>;
