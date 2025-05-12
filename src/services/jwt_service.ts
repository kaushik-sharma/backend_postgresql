import jwt from "jsonwebtoken";
import fs from "fs";
import { Transaction } from "sequelize";

import { SessionModel } from "../models/session/session_model.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import { AuthMode, EntityStatus, Platform } from "../constants/enums.js";
import RedisService from "./redis_service.js";
import {
  AUTH_TOKEN_EXPIRY_DURATION_IN_SEC,
  EMAIL_CODE_EXPIRY_DURATION_IN_SEC,
  SESSION_CACHE_EXPIRY_DURATION_IN_SEC,
} from "../constants/values.js";
import { AuthenticatedUser } from "../@types/custom.js";

export default class JwtService {
  static get #privateKey(): string {
    return fs.readFileSync(process.env.JWT_PRIVATE_KEY_FILE_NAME!, "utf8");
  }

  static get #publicKey(): string {
    return fs.readFileSync(process.env.JWT_PUBLIC_KEY_FILE_NAME!, "utf8");
  }

  static get #authTokenSignOptions(): jwt.SignOptions {
    const options: jwt.SignOptions = {
      algorithm: "PS512",
      expiresIn: AUTH_TOKEN_EXPIRY_DURATION_IN_SEC,
      keyid: "ps512-v1",
    };
    return options;
  }

  static get #emailTokenSignOptions(): jwt.SignOptions {
    const options: jwt.SignOptions = {
      algorithm: "PS512",
      expiresIn: EMAIL_CODE_EXPIRY_DURATION_IN_SEC,
      keyid: "ps512-v1",
    };
    return options;
  }

  static readonly #verifyJwt = (token: string): jwt.JwtPayload => {
    try {
      return jwt.verify(
        token,
        this.#publicKey,
        this.#authTokenSignOptions
      ) as jwt.JwtPayload;
    } catch (err: any) {
      if (err.name === jwt.TokenExpiredError.name) {
        throw new CustomError(401, "Auth token expired.");
      }
      throw err;
    }
  };

  static readonly createAuthToken = async (
    userId: string,
    userStatus: EntityStatus,
    deviceId: string,
    deviceName: string,
    platform: Platform,
    transaction: Transaction
  ): Promise<string> => {
    const session = await SessionModel.create(
      { userId, deviceId, deviceName, platform },
      { transaction }
    );
    const sessionId = session.toJSON().id!;

    await RedisService.client.set(
      `sessions:${sessionId}`,
      JSON.stringify({ userId, userStatus }),
      "EX",
      SESSION_CACHE_EXPIRY_DURATION_IN_SEC
    );

    const payload = { sessionId, userId, userStatus, v: 1 };

    return jwt.sign(payload, this.#privateKey, this.#authTokenSignOptions);
  };

  static readonly verifyAuthToken = async (
    token: string,
    { authMode }: { authMode: AuthMode }
  ): Promise<AuthenticatedUser> => {
    const decoded = this.#verifyJwt(token);

    const sessionId = decoded.sessionId as string | null | undefined;
    const userId = decoded.userId as string | null | undefined;
    const userStatus = decoded.userStatus as EntityStatus | null | undefined;

    if (!sessionId || !userId || !userStatus) {
      throw new CustomError(401, "Invalid auth token.");
    }

    const cachedSessionData = await RedisService.client.get(
      `sessions:${sessionId}`
    );
    let dbSessionData: SessionModel | null = null;

    if (cachedSessionData === null) {
      dbSessionData = await SessionModel.findByPk(sessionId, {
        attributes: ["userId"],
      });
    }

    if (!cachedSessionData && !dbSessionData) {
      throw new CustomError(404, "Session not found.");
    }

    const savedUserId =
      cachedSessionData !== null
        ? (JSON.parse(cachedSessionData)["userId"] as string)
        : dbSessionData!.toJSON().userId;

    if (userId !== savedUserId) {
      throw new CustomError(409, "Wrong user ID in the auth token.");
    }

    switch (authMode) {
      case AuthMode.authenticated:
        if (userStatus === EntityStatus.anonymous) {
          throw new CustomError(
            401,
            "Access denied: Anonymous users cannot perform this action."
          );
        } else if (userStatus !== EntityStatus.active) {
          throw new CustomError(403, "Access denied: User is not active.");
        }
        break;
      case AuthMode.allowAnonymous:
        // Both anonymous and authenticated users are allowed.
        if (
          userStatus !== EntityStatus.active &&
          userStatus !== EntityStatus.anonymous
        ) {
          throw new CustomError(
            403,
            "Access denied: User is neither active nor anonymous."
          );
        }
        break;
      case AuthMode.anonymousOnly:
        if (userStatus !== EntityStatus.anonymous) {
          throw new CustomError(
            401,
            "Access denied: Only anonymous users are allowed."
          );
        }
        break;
    }

    if (cachedSessionData === null) {
      await RedisService.client.set(
        `sessions:${sessionId}`,
        JSON.stringify({ userId, userStatus }),
        "EX",
        SESSION_CACHE_EXPIRY_DURATION_IN_SEC
      );
    }

    return { sessionId, userId, userStatus };
  };

  static readonly getRefreshToken = (user: AuthenticatedUser): string => {
    const payload = { ...user, v: 1 };
    return jwt.sign(payload, this.#privateKey, this.#authTokenSignOptions);
  };

  static readonly createEmailVerificationToken = (
    hashedEmail: string,
    hashedCodes: string[]
  ): string => {
    const payload = { hashedEmail, hashedCodes, v: 1 };
    return jwt.sign(payload, this.#privateKey, this.#emailTokenSignOptions);
  };

  static readonly verifyEmailToken = (token: string): [string, string[]] => {
    const decoded = this.#verifyJwt(token);

    const hashedEmail = decoded.hashedEmail as string | null | undefined;
    const hashedCodes = decoded.hashedCodes as string[] | null | undefined;

    if (!hashedEmail || !hashedCodes) {
      throw new CustomError(401, "Invalid auth token.");
    }

    return [hashedEmail, hashedCodes];
  };
}

/// ====================== Generate Keys ======================

// Private Key
// openssl genpkey -algorithm RSA -out private-key.pem -pkeyopt rsa_keygen_bits:2048

// Public Key
// openssl rsa -pubout -in private-key.pem -out public-key.pem
