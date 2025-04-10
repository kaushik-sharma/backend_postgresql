import mongoose, { Schema, InferSchemaType, Types } from "mongoose";

import Collections from "../../constants/collections.js";

const sessionSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      required: true,
      index: 1,
    },
  },
  { timestamps: true, versionKey: false }
);

export type SessionType = InferSchemaType<typeof sessionSchema>;

export const SessionModel = mongoose.model<SessionType>(
  "SessionModel",
  sessionSchema,
  Collections.sessions
);
