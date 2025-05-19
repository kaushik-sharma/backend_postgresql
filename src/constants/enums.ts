export enum Env {
  development = "DEVELOPMENT",
  production = "PRODUCTION",
}

export enum EntityStatus {
  active = "ACTIVE",
  banned = "BANNED",
  deleted = "DELETED",
  requestedDeletion = "REQUESTED_DELETION",
  anonymous = "ANONYMOUS",
}

export enum AuthUserAction {
  signIn = "SIGN_IN",
  signUp = "SIGN_UP",
  banned = "BANNED",
  requestedDeletion = "REQUESTED_DELETION",
}

export enum Gender {
  male = "MALE",
  female = "FEMALE",
  nonBinary = "NON_BINARY",
}

export enum AuthMode {
  authenticated = "AUTHENTICATED",
  anonymousOnly = "ANONYMOUS_ONLY",
  allowAnonymous = "ALLOW_ANONYMOUS",
}

export enum ReportTargetType {
  post = "POST",
  comment = "COMMENT",
  user = "USER",
}

export enum ReportReason {
  spam = "SPAM",
  misleading = "MISLEADING",
  hatefulContent = "HATEFUL_CONTENT",
}

export enum Platform {
  android = "ANDROID",
  ios = "IOS",
  web = "WEB",
}

export enum ReportStatus {
  active = "ACTIVE",
  resolved = "RESOLVED",
}
