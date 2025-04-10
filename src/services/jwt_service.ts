import jwt from "jsonwebtoken";
import fs from "fs";
import { ClientSession } from "mongoose";

import { SessionModel } from "../models/session/session_model.js";
import AuthDatasource from "../datasources/auth_datasource.js";
import { AuthMode } from "../middlewares/auth_middlewares.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import { EntityStatus } from "../constants/enums.js";

export default class JwtService {
  static readonly #generateJwt = (payload: Record<string, any>): string => {
    const privateKey = fs.readFileSync(
      process.env.JWT_PRIVATE_KEY_FILE_NAME!,
      "utf8"
    );
    const options: jwt.SignOptions = {
      algorithm: "RS512",
      expiresIn: "30d",
    };
    return jwt.sign(payload, privateKey, options);
  };

  static readonly getAuthToken = async (
    userId: string,
    session?: ClientSession
  ): Promise<string> => {
    const sessionModel = new SessionModel({
      userId: userId,
    });
    const result = await sessionModel.save({ session: session });
    const sessionId = result.id as string;

    const payload = {
      sessionId: sessionId,
    };

    return this.#generateJwt(payload);
  };

  static readonly verifyJwt = async (
    token: string,
    { authMode }: { authMode: AuthMode }
  ): Promise<[string, string]> => {
    const publicKey = fs.readFileSync(
      process.env.JWT_PUBLIC_KEY_FILE_NAME!,
      "utf8"
    );

    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, publicKey) as jwt.JwtPayload;
    } catch (err: any) {
      if (err.name === jwt.TokenExpiredError.name) {
        throw new CustomError(401, "Auth token expired.");
      }
      throw err;
    }

    const sessionId = decoded.sessionId as string | undefined;
    if (sessionId === undefined) {
      throw new CustomError(401, "Invalid auth token.");
    }

    const session = await SessionModel.findById(sessionId).lean();
    if (session === null) {
      throw new CustomError(403, "Session not found.");
    }

    const userId = session.userId.toString();

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

    return this.#generateJwt(payload);
  };
}

/// ====================== Generate Keys ======================

// Private Key
// openssl genpkey -algorithm RSA -out private-key.pem -pkeyopt rsa_keygen_bits:2048

// Public Key
// openssl rsa -pubout -in private-key.pem -out public-key.pem
