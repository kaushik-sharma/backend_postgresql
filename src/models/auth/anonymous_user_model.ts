import mongoose, { InferSchemaType, Schema } from "mongoose";
import Collections from "../../constants/collections.js";
import { EntityStatus } from "../../constants/enums.js";

const anonymousUserSchema = new Schema(
  {
    status: {
      type: String,
      enum: Object.values(EntityStatus),
    },
  },
  { versionKey: false, timestamps: true, autoCreate: false }
);

anonymousUserSchema.pre<AnonymousUserType>("save", function (next) {
  this.status = EntityStatus.anonymous;
  next();
});

export type AnonymousUserType = InferSchemaType<typeof anonymousUserSchema> & {
  _id: string;
};

export const AnonymousUserModel = mongoose.model<AnonymousUserType>(
  "AnonymousUserModel",
  anonymousUserSchema,
  Collections.users
);
