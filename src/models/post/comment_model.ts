import mongoose, { InferSchemaType, Schema, Types } from "mongoose";
import Collections from "../../constants/collections.js";
import { MAX_COMMENT_LEVEL } from "../../constants/values.js";
import { EntityStatus } from "../../constants/enums.js";

const commentSchema = new Schema(
  {
    postId: { type: Types.ObjectId, index: 1, required: true },
    userId: { type: Types.ObjectId, index: 1, required: true },
    parentCommentId: { type: Types.ObjectId },
    level: {
      type: Number,
      required: true,
      validate: {
        validator: (value: number) => value >= 0 && value < MAX_COMMENT_LEVEL,
        message: `Level must be less than ${MAX_COMMENT_LEVEL}.`,
      },
    },
    text: {
      type: String,
      required: true,
      trim: true,
      minLength: 1,
      maxLength: 255,
    },
    status: {
      type: String,
      enum: Object.values(EntityStatus),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

commentSchema.pre<CommentType>("save", function (next) {
  this.status = EntityStatus.active;
  next();
});

export type CommentType = InferSchemaType<typeof commentSchema> & {
  _id: string;
};

export const CommentModel = mongoose.model<CommentType>(
  "CommentModel",
  commentSchema,
  Collections.comments
);

const commentViewSchema = new Schema(
  {
    firstName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: false,
    },
    profileImageUrl: {
      type: String,
      required: false,
    },
    createdAt: {
      type: Date,
      required: false,
    },
    parentCommentId: {
      type: String,
      required: false,
    },
    text: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(EntityStatus),
    },
  },
  {
    timestamps: false,
    versionKey: false,
    autoCreate: false,
  }
);

export type CommentViewType = InferSchemaType<typeof commentViewSchema>;

export const CommentViewModel = mongoose.model<CommentViewType>(
  "CommentViewModel",
  commentViewSchema
);
