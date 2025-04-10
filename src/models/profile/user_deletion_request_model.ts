import mongoose, { Schema, InferSchemaType, Types } from "mongoose";
import Collections from "../../constants/collections.js";

const userDeletionRequestSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      required: true,
      unique: true,
      index: 1,
    },
    deleteAt: {
      type: Date,
      required: true,
      index: 1,
      validate: {
        validator: (value: string) => {
          const date = new Date(value);
          const now = new Date();
          return date > now;
        },
        message: "Deletion date can not be before now.",
      },
    },
  },
  { timestamps: true, versionKey: false }
);

export type UserDeletionRequestType = InferSchemaType<
  typeof userDeletionRequestSchema
>;

export const UserDeletionRequestModel = mongoose.model<UserDeletionRequestType>(
  "UserDeletionRequestModel",
  userDeletionRequestSchema,
  Collections.userDeletionRequests
);
