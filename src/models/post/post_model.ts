import mongoose, { InferSchemaType, Schema, Types } from "mongoose";
import Collections from "../../constants/collections.js";
import { EntityStatus } from "../../constants/enums.js";

const postSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      index: 1,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      minLength: 1,
      maxLength: 255,
    },
    imagePath: {
      type: String,
      required: false,
      default: null,
      trim: true,
      maxLength: 255,
    },
    repostedPostId: {
      type: Types.ObjectId,
      default: null,
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

postSchema.pre<PostType>("save", function (next) {
  this.status = EntityStatus.active;
  next();
});

export type PostType = InferSchemaType<typeof postSchema>;

export const PostModel = mongoose.model<PostType>(
  "PostModel",
  postSchema,
  Collections.posts
);

const postFeedDataFields = {
  _id: Types.ObjectId,
  text: String,
  imageUrl: {
    type: String,
    default: null,
  },
  likeCount: Number,
  dislikeCount: Number,
  commentCount: Number,
  createdAt: Date,
  userId: Types.ObjectId,
  firstName: String,
  lastName: String,
  profileImageUrl: String,
};

const postFeedSchema = new Schema(
  {
    ...postFeedDataFields,
    repostedPost: postFeedDataFields,
  },
  {
    timestamps: false,
    versionKey: false,
    autoCreate: false,
  }
);

export type PostFeedType = InferSchemaType<typeof postFeedSchema>;

export const PostFeedModel = mongoose.model<PostFeedType>(
  "PostFeedModel",
  postFeedSchema
);
