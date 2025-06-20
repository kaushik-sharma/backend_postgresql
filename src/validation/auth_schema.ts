import { z } from "zod";
import { DateTime } from "luxon";

import { Gender, Platform } from "../generated/prisma/index.js";
import { Constants } from "../constants/values.js";
import {
  COUNTRY_CODE_REGEX,
  DOB_DATE_REGEX,
  PHONE_NUMBER_REGEX,
} from "../constants/regex.js";

const emailValidation = z
  .string({ required_error: "Email is required." })
  .trim()
  .nonempty({ message: "Email must not be empty." })
  .email()
  .transform((value) => value.toLowerCase());

const verificationCodeValidation = z
  .string({ required_error: "Verification code is required." })
  .trim()
  .nonempty({ message: "Verification code can not be empty." })
  .length(6, { message: "Verification code must be 6 characters long." })
  .regex(/^\d{6}$/, { message: "Must contain only digits." });

const verificationTokenValidation = z
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
    message: "DoB format is invalid. Expected format - 'yyyy-MM-dd'",
  })
  .superRefine((value, ctx) => {
    const inputDate = DateTime.fromFormat(value, "yyyy-MM-dd", { zone: "utc" });

    if (!inputDate.isValid) {
      ctx.addIssue({
        code: "custom",
        message: "Date is not parsable.",
      });
      return;
    }

    const now = DateTime.utc();
    const plusMinAge = inputDate.plus({
      years: Constants.minAccountOpeningAge,
    });

    if (plusMinAge > now) {
      ctx.addIssue({
        code: "custom",
        message: `Minimum age to open an account is ${Constants.minAccountOpeningAge} years.`,
      });
      return;
    }

    if (inputDate < Constants.minDobDate) {
      ctx.addIssue({
        code: "custom",
        message: `Minimum date for DoB: ${Constants.minDobDate.toISODate()}`,
      });
      return;
    }
  });

const deviceIdValidation = z
  .string({ required_error: "Device ID is required." })
  .trim()
  .nonempty({ message: "Device Id can not be empty." })
  .max(255, { message: "Device Id can not be more than 255 characters." });

const deviceNameValidation = z
  .string({ required_error: "Device name is required." })
  .trim()
  .nonempty({ message: "Device name can not be empty." })
  .max(255, { message: "Device name can not be more than 255 characters." });

const platformValidation = z.nativeEnum(Platform, {
  required_error: "Platform is required.",
});

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
  deviceId: deviceIdValidation,
  deviceName: deviceNameValidation,
  platform: platformValidation,
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
  deviceId: deviceIdValidation,
  deviceName: deviceNameValidation,
  platform: platformValidation,
});

export type SignUpType = z.infer<typeof signUpSchema>;

export const anonymousAuthSchema = z.object({
  deviceId: deviceIdValidation,
  deviceName: deviceNameValidation,
  platform: platformValidation,
});

export type AnonymousAuthType = z.infer<typeof anonymousAuthSchema>;
