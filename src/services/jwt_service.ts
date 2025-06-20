import jwt from "jsonwebtoken";
import fs from "fs";

import { PrismaService } from "../services/prisma_service.js";
import { Prisma, EntityStatus, Platform, Session } from "../generated/prisma/index.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import { AuthMode } from "../constants/enums.js";
import { RedisService } from "./redis_service.js";
import { Constants } from "../constants/values.js";
import { AuthenticatedUser } from "../@types/custom.js";

export class JwtService {
  static get #privateKey(): string {
    return fs.readFileSync(process.env.JWT_PRIVATE_KEY_FILE_NAME!, "utf8");
  }

  static get #publicKey(): string {
    return fs.readFileSync(process.env.JWT_PUBLIC_KEY_FILE_NAME!, "utf8");
  }

  static get #authTokenSignOptions(): jwt.SignOptions {
    const options: jwt.SignOptions = {
      algorithm: "PS512",
      expiresIn: Constants.authTokenExpiryDurationInSec,
      keyid: "ps512-v1",
    };
    return options;
  }

  static get #emailTokenSignOptions(): jwt.SignOptions {
    const options: jwt.SignOptions = {
      algorithm: "PS512",
      expiresIn: Constants.emailCodeExpiryDurationInSec,
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
    transaction: Prisma.TransactionClient
  ): Promise<string> => {
    const session = await transaction.session.create({
      data: { userId, deviceId, deviceName, platform },
    });

    await RedisService.client.set(
      `sessions:${session.id}`,
      JSON.stringify({ userId, userStatus }),
      "EX",
      Constants.sessionCacheExpiryDurationInSec
    );

    const payload = { sessionId: session.id, userId, userStatus, v: 1 };

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
    let dbSessionData: Pick<Session, "userId"> | null = null;

    if (cachedSessionData === null) {
      dbSessionData = await PrismaService.client.session.findUnique({
        where: { id: sessionId },
        select: { userId: true },
      });
    }

    if (!cachedSessionData && !dbSessionData) {
      throw new CustomError(404, "Session not found.");
    }

    const savedUserId =
      cachedSessionData !== null
        ? (JSON.parse(cachedSessionData)["userId"] as string)
        : dbSessionData!.userId;

    if (userId !== savedUserId) {
      throw new CustomError(409, "Wrong user ID in the auth token.");
    }

    switch (authMode) {
      case AuthMode.AUTHENTICATED:
        if (userStatus === EntityStatus.ANONYMOUS) {
          throw new CustomError(
            401,
            "Access denied: Anonymous users cannot perform this action."
          );
        } else if (userStatus !== EntityStatus.ACTIVE) {
          throw new CustomError(403, "Access denied: User is not active.");
        }
        break;
      case AuthMode.ALLOW_ANONYMOUS:
        // Both anonymous and authenticated users are allowed.
        if (
          userStatus !== EntityStatus.ACTIVE &&
          userStatus !== EntityStatus.ANONYMOUS
        ) {
          throw new CustomError(
            403,
            "Access denied: User is neither active nor anonymous."
          );
        }
        break;
      case AuthMode.ANONYMOUS_ONLY:
        if (userStatus !== EntityStatus.ANONYMOUS) {
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
        Constants.sessionCacheExpiryDurationInSec
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
