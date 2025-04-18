import { RequestHandler } from "express";
import { randomInt } from "crypto";

import { asyncHandler } from "../helpers/async_handler.js";
import {
  emailSchema,
  EmailType,
  requestEmailCodeSchema,
  RequestEmailCodeType,
  signInSchema,
  SignInType,
  signUpSchema,
  SignUpType,
} from "../validation/auth_schema.js";
import { validateModel } from "../helpers/validation_helper.js";
import AuthDatasource from "../datasources/auth_datasource.js";
import { successResponseHandler } from "../helpers/success_handler.js";
import { AuthUserAction, EntityStatus, Env } from "../constants/enums.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import JwtService from "../services/jwt_service.js";
import { UserModel } from "../models/auth/user_model.js";
import { performTransaction } from "../helpers/transaction_helper.js";
import ProfileDatasource from "../datasources/profile_datasource.js";
import BcryptService from "../services/bcrypt_service.js";
import MailService from "../services/mail_service.js";
import { ENV, DEV_EMAIL_VERIFICATION_WHITELIST } from "../constants/values.js";

export class AuthController {
  static readonly #generateVerificationCode = (): string => {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += randomInt(0, 10).toString();
    }
    return code;
  };

  static readonly #requiresEmailVerification = (email: string): boolean => {
    if (ENV === Env.production) return true;

    const domain = email.split("@")[1];
    return DEV_EMAIL_VERIFICATION_WHITELIST.includes(domain);
  };

  static readonly #sendEmailCode = async (
    email: string,
    previousToken: string | undefined
  ): Promise<string> => {
    let prevHashedEmail: string | null = null;
    let prevHashedCodes: string[] | null = null;
    if (previousToken !== undefined) {
      [prevHashedEmail, prevHashedCodes] =
        JwtService.verifyEmailToken(previousToken);
    }

    if (prevHashedEmail !== null) {
      const isEmailEqual = await BcryptService.compare(email, prevHashedEmail);
      if (!isEmailEqual) {
        throw new CustomError(401, "Email does not match!");
      }
    }

    const code = this.#generateVerificationCode();
    const hashedCode = await BcryptService.hash(code);
    const hashedEmail = await BcryptService.hash(email);

    const newToken = JwtService.createEmailVerificationToken(hashedEmail, [
      ...(prevHashedCodes ?? []),
      hashedCode,
    ]);

    if (this.#requiresEmailVerification(email)) {
      MailService.sendMail({
        recipientEmail: email,
        subject: "Account Verification Code",
        body: code,
      });
    }

    return newToken;
  };

  static readonly #verifyEmailTokenCredentials = async (
    email: string,
    code: string,
    token: string
  ): Promise<void> => {
    if (!this.#requiresEmailVerification(email)) return;

    const [hashedEmail, hashedCodes] = JwtService.verifyEmailToken(token);

    const isEmailEqual = await BcryptService.compare(email, hashedEmail);
    let isCodeEqual: boolean = false;
    for (const hashedCode of hashedCodes) {
      isCodeEqual = await BcryptService.compare(code, hashedCode);
      if (isCodeEqual) break;
    }

    if (!isEmailEqual) {
      throw new CustomError(401, "Email does not match!");
    }
    if (!isCodeEqual) {
      throw new CustomError(401, "Incorrect verification code!");
    }
  };

  static readonly validateEmailRequest: RequestHandler = (req, res, next) => {
    req.parsedData = validateModel(emailSchema, req.body);
    next();
  };

  static readonly validateEmailCodeRequest: RequestHandler = (
    req,
    res,
    next
  ) => {
    req.parsedData = validateModel(requestEmailCodeSchema, req.body);
    next();
  };

  static readonly checkEmail: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const parsedData = req.parsedData! as EmailType;

      const user = await AuthDatasource.findUserByEmail(parsedData.email);

      if (user === null) {
        return successResponseHandler({
          res: res,
          status: 200,
          data: { userAction: AuthUserAction.signUp },
        });
      }

      // Checking if the user is marked for deletion
      if (user.status === EntityStatus.scheduledDeletion) {
        return successResponseHandler({
          res: res,
          status: 200,
          data: { userAction: AuthUserAction.requestedDeletion },
        });
      }

      switch (user!.status!) {
        case EntityStatus.active:
          return successResponseHandler({
            res: res,
            status: 200,
            data: { userAction: AuthUserAction.signIn },
          });
        case EntityStatus.banned:
          return successResponseHandler({
            res: res,
            status: 200,
            data: { userAction: AuthUserAction.banned },
          });
      }
    }
  );

  static readonly requestEmailCode: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const parsedData = req.parsedData! as RequestEmailCodeType;
      const token = await this.#sendEmailCode(
        parsedData.email,
        parsedData.previousToken
      );

      successResponseHandler({
        res: res,
        status: 200,
        data: { verificationToken: token },
      });
    }
  );

  static readonly validateSignUpRequest: RequestHandler = (req, res, next) => {
    req.parsedData = validateModel(signUpSchema, req.body);
    next();
  };

  static readonly signUp: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const anonymousUserId = req.user?.userId ?? null;

      const parsedData = req.parsedData! as SignUpType;

      const email = parsedData.email;
      const countryCode = parsedData.countryCode;
      const phoneNumber = parsedData.phoneNumber;

      const canSignUpWithEmail = await AuthDatasource.canSignUpWithEmail(email);
      if (!canSignUpWithEmail) {
        throw new CustomError(409, "Account with this email already exists.");
      }

      const canSignUpWithPhoneNumber =
        await AuthDatasource.canSignUpWithPhoneNumber(countryCode, phoneNumber);
      if (!canSignUpWithPhoneNumber) {
        throw new CustomError(
          409,
          "Account with this phone number already exists."
        );
      }

      await this.#verifyEmailTokenCredentials(
        parsedData.email,
        parsedData.verificationCode,
        parsedData.verificationToken
      );

      const user = new UserModel({
        firstName: parsedData.firstName,
        lastName: parsedData.lastName,
        gender: parsedData.gender,
        countryCode: parsedData.countryCode,
        phoneNumber: parsedData.phoneNumber,
        email: parsedData.email,
        dob: parsedData.dob,
        status: EntityStatus.active,
      });

      const authToken = await performTransaction<string>(
        async (transaction) => {
          /// Delete anonymous user (if exists)
          if (anonymousUserId !== null) {
            await AuthDatasource.signOutAllSessions(
              anonymousUserId,
              transaction
            );
            await AuthDatasource.deleteAnonymousUser(
              anonymousUserId,
              transaction
            );
          }
          const userId = await AuthDatasource.createUser(user, transaction);
          return await JwtService.createAuthToken(userId, transaction);
        }
      );

      successResponseHandler({
        res: res,
        status: 200,
        data: { authToken: authToken },
      });
    }
  );

  static readonly validateSignInRequest: RequestHandler = (req, res, next) => {
    req.parsedData = validateModel(signInSchema, req.body);
    next();
  };

  static readonly signIn: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const anonymousUserId = req.user?.userId ?? null;

      const parsedData = req.parsedData! as SignInType;

      const user = await AuthDatasource.findUserByEmail(parsedData.email);

      if (user === null) {
        throw new CustomError(404, "Account with this email does not exist.");
      }

      await this.#verifyEmailTokenCredentials(
        parsedData.email,
        parsedData.verificationCode,
        parsedData.verificationToken
      );

      if (user.status === EntityStatus.banned) {
        throw new CustomError(
          403,
          "Your account is banned due to violation of our moderation guidelines. Please contact our customer support."
        );
      }

      if (parsedData.cancelAccountDeletionRequest) {
        await ProfileDatasource.removeDeletionRequest(user.id);
      }

      // Checking if the user is marked for deletion
      if (user.status === EntityStatus.scheduledDeletion) {
        throw new CustomError(
          403,
          "You have an active account deletion request pending."
        );
      }

      const authToken = await performTransaction<string>(
        async (transaction) => {
          /// Delete anonymous user (if exists)
          if (anonymousUserId !== null) {
            await AuthDatasource.signOutAllSessions(
              anonymousUserId!,
              transaction
            );
            await AuthDatasource.deleteAnonymousUser(
              anonymousUserId!,
              transaction
            );
          }
          return await JwtService.createAuthToken(user.id, transaction);
        }
      );

      successResponseHandler({
        res: res,
        status: 200,
        data: { authToken: authToken },
      });
    }
  );

  static readonly signOut: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const { userId, sessionId } = req.user!;

      await AuthDatasource.signOutSession(userId, sessionId);

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );

  static readonly signOutAllSessions: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      await AuthDatasource.signOutAllSessions(userId);

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );

  static readonly refreshAuthToken: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const sessionId = req.user!.sessionId;

      const refreshToken = JwtService.getRefreshToken(sessionId);

      successResponseHandler({
        res: res,
        status: 200,
        data: { refreshToken: refreshToken },
      });
    }
  );

  static readonly anonymousAuth: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const user = new UserModel({
        status: EntityStatus.anonymous,
      });

      const authToken = await performTransaction<string>(
        async (transaction) => {
          const userId = await AuthDatasource.createUser(user, transaction);
          return await JwtService.createAuthToken(userId, transaction);
        }
      );

      successResponseHandler({
        res: res,
        status: 200,
        data: { authToken: authToken },
      });
    }
  );
}
