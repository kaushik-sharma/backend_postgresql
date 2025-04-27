export class Env {
  private constructor(
    public readonly name: string,
    public readonly filePath: string
  ) {}

  static readonly development = new Env("development", ".env.development");
  static readonly production = new Env("production", ".env.production");

  static values(): Env[] {
    return [Env.development, Env.production];
  }

  static fromString(envStr: string): Env {
    const env = this.values().find((e) => e.name === envStr);
    if (env === undefined) {
      throw new Error(`Invalid environment specified: ${envStr}`);
    }
    return env;
  }
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
