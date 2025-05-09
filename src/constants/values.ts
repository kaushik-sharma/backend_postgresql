import { DateTime, Duration } from "luxon";

import { AwsS3FileCategory } from "../services/aws_s3_service.js";
import { Env } from "./enums.js";

export let ENV: Env;
export const initEnv = (env: Env) => (ENV = env);

/// Images
export const IMAGE_EXPIRY_DURATION = Duration.fromObject({ hours: 48 });

/// Users
export const MIN_DOB_DATE = DateTime.utc(1901, 1, 1);
export const MIN_ACCOUNT_OPENING_AGE = 18;
export const DEFAULT_PROFILE_IMAGE_PATH = `${AwsS3FileCategory.static}/default_profile_image.png`;
export const USER_DELETION_GRACE_PERIOD_DURATION = () =>
  ENV === Env.development
    ? Duration.fromObject({ minutes: 10 })
    : Duration.fromObject({ days: 30 });

/// Posts
export const MAX_COMMENT_LEVEL = 5;
export const POSTS_PAGE_SIZE = 20;
export const COMMENTS_PAGE_SIZE = 30;

/// Content Moderation
export const POST_BAN_THRESHOLD = () => (ENV === Env.development ? 20 : 2000);
export const COMMENT_BAN_THRESHOLD = () =>
  ENV === Env.development ? 10 : 1000;
export const USER_BAN_THRESHOLD = () => (ENV === Env.development ? 10 : 1000);

/// Rate Limiter
export const DEFAULT_RATE_LIMITER_WINDOW_MS = 300000; // 5 minutes
export const DEFAULT_RATE_LIMITER_MAX = 100;
export const MODERATION_RATE_LIMITER_WINDOW_MS = 86400000; // 24 hours
export const MODERATION_RATE_LIMITER_MAX = 100;
export const REQUEST_EMAIL_CODE_RATE_LIMITER_WINDOW_MS = 3600000; // 1 hour
export const REQUEST_EMAIL_CODE_RATE_LIMITER_MAX = 5;

/// Files
export const MAX_IMAGE_FILE_SIZE_IN_BYTES = 3145728; // 3 MB
export const ALLOWED_IMAGE_MIMETYPES = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const DEV_EMAIL_VERIFICATION_WHITELIST = ["gmail.com"];

/// Redis
export const AUTH_TOKEN_DATA_CACHE_EXPIRY_IN_SEC = Duration.fromObject({
  days: 7,
}).as("seconds");
