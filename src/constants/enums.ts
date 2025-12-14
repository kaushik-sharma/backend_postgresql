export type Env = "DEVELOPMENT" | "PRODUCTION";

export type AuthUserAction =
  | "SIGN_IN"
  | "SIGN_UP"
  | "BANNED"
  | "REQUESTED_DELETION";

export type AuthMode = "AUTHENTICATED" | "ANONYMOUS_ONLY" | "ALLOW_ANONYMOUS";
