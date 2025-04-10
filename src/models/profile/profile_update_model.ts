import mongoose, { Schema, InferSchemaType } from "mongoose";

import { Gender } from "../auth/user_model.js";
import {
  MIN_ACCOUNT_OPENING_AGE,
  MIN_DOB_DATE,
} from "../../constants/values.js";
import { DateUtils } from "../../utils/date_utils.js";
import { DOB_DATE_REGEX } from "../../constants/validators.js";

const profileUpdateSchema = new Schema(
  {
    firstName: {
      type: String,
      required: false,
      trim: true,
      minLength: 1,
      maxLength: 30,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
      minLength: 1,
      maxLength: 30,
    },
    gender: {
      type: String,
      required: false,
      trim: true,
      enum: Object.values(Gender),
    },
    profileImagePath: {
      type: String,
      required: false,
      trim: true,
      maxLength: 255,
    },
    dob: {
      type: String,
      required: false,
      trim: true,
      validate: [
        {
          validator: (value: string | null) => value !== null,
          message: "Dob can not be null.",
        },
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
  },
  { _id: false, timestamps: false, versionKey: false, autoCreate: false }
);

export type ProfileUpdateType = InferSchemaType<typeof profileUpdateSchema>;

export const ProfileUpdateModel = mongoose.model<ProfileUpdateType>(
  "ProfileUpdateModel",
  profileUpdateSchema
);
