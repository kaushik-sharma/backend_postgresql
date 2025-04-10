import { AwsS3FileCategory } from "../services/aws_s3_service.js";

export const IMAGE_EXPIRY_TIME_IN_MILLISECONDS = 86400000; // 24 hours

/// Users
export const MIN_DOB_DATE = new Date(Date.UTC(1901, 0, 1));
export const MIN_ACCOUNT_OPENING_AGE = 18;
export const DEFAULT_PROFILE_IMAGE_PATH = `${AwsS3FileCategory.static}/default_profile_image.png`;

/// Posts
export const MAX_COMMENT_LEVEL = 5;
export const POSTS_PAGE_SIZE = 20;
export const COMMENTS_PAGE_SIZE = 30;

/// Content Moderation
export const POST_BAN_THRESHOLD = 2000;
export const COMMENT_BAN_THRESHOLD = 1000;
export const USER_BAN_THRESHOLD = 1000;

/// Rate Limiter
export const DEFAULT_RATE_LIMITER_WINDOW_MS = 300000; // 5 minutes
export const DEFAULT_RATE_LIMITER_MAX = 100;
export const MODERATION_RATE_LIMITER_WINDOW_MS = 86400000; // 24 hours
export const MODERATION_RATE_LIMITER_MAX = 100;

/// Files
export const MAX_IMAGE_FILE_SIZE_IN_BYTES = 3145728; // 3 MB
export const ALLOWED_IMAGE_MIMETYPES = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
