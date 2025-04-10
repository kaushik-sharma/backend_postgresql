import mongoose, { Schema, InferSchemaType } from "mongoose";
import validator from "validator";

import Collections from "../../constants/collections.js";
import { DateUtils } from "../../utils/date_utils.js";
import {
  MIN_ACCOUNT_OPENING_AGE,
  MIN_DOB_DATE,
} from "../../constants/values.js";
import {
  COUNTRY_CODE_REGEX,
  DOB_DATE_REGEX,
  PHONE_NUMBER_REGEX,
} from "../../constants/validators.js";
import BcryptService from "../../services/bcrypt_service.js";
import { EntityStatus } from "../../constants/enums.js";

export enum Gender {
  male = "MALE",
  female = "FEMALE",
  nonBinary = "NON_BINARY",
}

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minLength: 1,
      maxLength: 30,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minLength: 1,
      maxLength: 30,
    },
    gender: {
      type: String,
      required: true,
      trim: true,
      enum: Object.values(Gender),
    },
    countryCode: {
      type: String,
      index: 1,
      required: true,
      trim: true,
      validate: {
        validator: (value: string) => COUNTRY_CODE_REGEX.test(value),
        message: "Country code is invalid.",
      },
    },
    phoneNumber: {
      type: String,
      index: 1,
      required: true,
      trim: true,
      validate: {
        validator: (value: string) => PHONE_NUMBER_REGEX.test(value),
        message: "Phone number is invalid.",
      },
    },
    email: {
      type: String,
      index: 1,
      required: true,
      minLength: 1,
      maxLength: 255,
      trim: true,
      set: (value: string) => value.toLowerCase(),
      validate: {
        validator: (value: string) => validator.isEmail(value),
        message: "Email address is invalid.",
      },
    },
    dob: {
      type: String,
      required: true,
      trim: true,
      validate: [
        {
          validator: (value: string) => DOB_DATE_REGEX.test(value),
          message: "DoB format is invalid. Expected format - 'YYYY-mm-DD'",
        },
        {
          validator: (value: string) => {
            const date = new Date(value);
            const now = new Date();
            const maxDate = DateUtils.subtractYearsFromDate(
              now,
              MIN_ACCOUNT_OPENING_AGE
            );
            return date <= maxDate;
          },
          message: `Minimum age to open an account is ${MIN_ACCOUNT_OPENING_AGE}.`,
        },
        {
          validator: (value: string) => {
            const date = new Date(value);
            const minDate = MIN_DOB_DATE;
            return date >= minDate;
          },
          message: `Minimum date for DoB: ${MIN_DOB_DATE.toISOString()}`,
        },
      ],
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minLength: 8,
      maxLength: 255,
    },
    profileImagePath: {
      type: String,
      required: false,
      default: null,
      trim: true,
      maxLength: 255,
    },
    status: {
      type: String,
      enum: Object.values(EntityStatus),
    },
  },
  { versionKey: false, timestamps: true }
);

userSchema.pre<UserType>("save", async function (next) {
  // Hash the password before saving
  const hashedPassword = await BcryptService.hash(this.password);
  this.password = hashedPassword;

  this.profileImagePath = null;

  this.status = EntityStatus.active;

  next();
});

export type UserType = InferSchemaType<typeof userSchema> & {
  _id: string;
};

export const UserModel = mongoose.model<UserType>(
  "UserModel",
  userSchema,
  Collections.users
);
