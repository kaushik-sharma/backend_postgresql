import jwt from "jsonwebtoken";
import fs from "fs";
import { Transaction } from "sequelize";
import { $enum } from "ts-enum-util";

import { SessionModel } from "../models/session/session_model.js";
import UserDatasource from "../datasources/user_datasource.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import { AuthMode, EntityStatus, Platform } from "../constants/enums.js";
import RedisService from "./redis_service.js";
import { AUTH_TOKEN_DATA_CACHE_EXPIRY_IN_SEC } from "../constants/values.js";

export default class JwtService {
  static get #privateKey(): string {
    return fs.readFileSync(process.env.JWT_PRIVATE_KEY_FILE_NAME!, "utf8");
  }

  static get #publicKey(): string {
    return fs.readFileSync(process.env.JWT_PUBLIC_KEY_FILE_NAME!, "utf8");
  }

  static readonly #generateAuthTokenJwt = (
    payload: Record<string, any>
  ): string => {
    const options: jwt.SignOptions = {
      algorithm: "RS512",
      expiresIn: "30d", // 30 days
    };
    return jwt.sign(payload, this.#privateKey, options);
  };

  static readonly #verifyJwt = (token: string): jwt.JwtPayload => {
    try {
      return jwt.verify(token, this.#publicKey) as jwt.JwtPayload;
    } catch (err: any) {
      if (err.name === jwt.TokenExpiredError.name) {
        throw new CustomError(401, "Auth token expired.");
      }
      throw err;
    }
  };

  static readonly #getUserIdFromSessionId = async (
    sessionId: string
  ): Promise<string> => {
    let userId: string | null = null;
    userId = await RedisService.client.get(`sessions:${sessionId}`);
    if (userId === null) {
      const dbSession = await SessionModel.findByPk(sessionId, {
        attributes: ["userId"],
      });
      if (dbSession === null) {
        throw new CustomError(403, "Session not found.");
      }
      userId = dbSession.toJSON().userId;
      await RedisService.client.set(
        `sessions:${sessionId}`,
        userId,
        "EX",
        AUTH_TOKEN_DATA_CACHE_EXPIRY_IN_SEC
      );
    }
    return userId;
  };

  static readonly #getUserStatusFromUserId = async (
    userId: string
  ): Promise<EntityStatus> => {
    let status: EntityStatus | null = null;
    const statusStr = await RedisService.client.get(`users:status:${userId}`);
    if (statusStr !== null) {
      status = $enum(EntityStatus).asValueOrThrow(statusStr);
    } else {
      status = await UserDatasource.getUserStatus(userId);
      await RedisService.client.set(
        `users:status:${userId}`,
        status.toString(),
        "EX",
        AUTH_TOKEN_DATA_CACHE_EXPIRY_IN_SEC
      );
    }
    return status;
  };

  static readonly createAuthToken = async (
    userId: string,
    deviceId: string,
    deviceName: string,
    platform: Platform,
    transaction?: Transaction
  ): Promise<string> => {
    const session = await SessionModel.create(
      { userId, deviceId, deviceName, platform },
      { transaction }
    );
    const sessionId = session.toJSON().id!;

    await RedisService.client.set(
      `sessions:${sessionId}`,
      userId,
      "EX",
      AUTH_TOKEN_DATA_CACHE_EXPIRY_IN_SEC
    );

    const payload = {
      sessionId: sessionId,
    };

    return this.#generateAuthTokenJwt(payload);
  };

  static readonly verifyAuthToken = async (
    token: string,
    { authMode }: { authMode: AuthMode }
  ): Promise<[string, string]> => {
    const decoded = this.#verifyJwt(token);

    const sessionId = decoded.sessionId as string | null | undefined;
    if (!sessionId) {
      throw new CustomError(401, "Invalid auth token.");
    }

    const userId = await this.#getUserIdFromSessionId(sessionId);
    const userStatus = await this.#getUserStatusFromUserId(userId);

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

    return [userId, sessionId];
  };

  static readonly getRefreshToken = (sessionId: string): string => {
    const payload = {
      sessionId: sessionId,
    };
    return this.#generateAuthTokenJwt(payload);
  };

  static readonly createEmailVerificationToken = (
    hashedEmail: string,
    hashedCodes: string[]
  ): string => {
    const payload = {
      hashedEmail: hashedEmail,
      hashedCodes: hashedCodes,
    };
    const options: jwt.SignOptions = {
      algorithm: "RS512",
      expiresIn: 600, // 10 minutes
    };
    return jwt.sign(payload, this.#privateKey, options);
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
