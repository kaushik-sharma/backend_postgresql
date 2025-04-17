import jwt from "jsonwebtoken";
import fs from "fs";
import { Transaction } from "sequelize";

import { SessionModel } from "../models/session/session_model.js";
import AuthDatasource from "../datasources/auth_datasource.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import { AuthMode, EntityStatus } from "../constants/enums.js";

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

  static readonly createAuthToken = async (
    userId: string,
    transaction?: Transaction
  ): Promise<string> => {
    const session = await SessionModel.create(
      { userId: userId },
      { transaction: transaction }
    );
    const payload = {
      sessionId: session.id,
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

    const session = await SessionModel.findByPk(sessionId, {
      raw: true,
    });
    if (session === null) {
      throw new CustomError(403, "Session not found.");
    }

    const userId = session.userId;

    const userStatus = await AuthDatasource.getUserStatus(userId);

    switch (authMode) {
      case AuthMode.AUTHENTICATED:
        if (userStatus === EntityStatus.anonymous) {
          throw new CustomError(
            401,
            "Access denied: Anonymous users cannot perform this action."
          );
        } else if (userStatus !== EntityStatus.active) {
          throw new CustomError(403, "Access denied: User is not active.");
        }
        break;
      case AuthMode.ALLOW_ANONYMOUS:
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
      case AuthMode.ANONYMOUS_ONLY:
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
    hashedCodes: string[],
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
