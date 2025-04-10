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

  static fromString(envStr: string | undefined): Env {
    const env = this.values().find((e) => e.name === envStr);
    if (env === undefined) {
      throw new Error(`Invalid environment specified: ${envStr}`);
    }
    return env;
  }
}

export enum EntityStatus {
  active = "ACTIVE",
  deleted = "DELETED",
  banned = "BANNED",
  anonymous = "ANONYMOUS",
}
