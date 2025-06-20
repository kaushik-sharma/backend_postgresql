import { RequestHandler } from "express";
import { randomInt } from "crypto";

import { EntityStatus, Prisma } from "../generated/prisma/index.js";
import { asyncHandler } from "../helpers/async_handler.js";
import {
  anonymousAuthSchema,
  AnonymousAuthType,
  emailSchema,
  EmailType,
  requestEmailCodeSchema,
  RequestEmailCodeType,
  signInSchema,
  SignInType,
  signUpSchema,
  SignUpType,
} from "../validation/auth_schema.js";
import { validateData } from "../helpers/validation_helper.js";
import { successResponseHandler } from "../helpers/success_handler.js";
import { AuthUserAction, Env } from "../constants/enums.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import { JwtService } from "../services/jwt_service.js";
import { BcryptService } from "../services/bcrypt_service.js";
import { MailService } from "../services/mail_service.js";
import { Constants } from "../constants/values.js";
import { UserDatasource } from "../datasources/user_datasource.js";
import { PrismaService } from "../services/prisma_service.js";
import { SessionDatasource } from "../datasources/session_datasource.js";

export class AuthController {
  static readonly #generateVerificationCode = (): string => {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += randomInt(0, 10).toString();
    }
    return code;
  };

  static readonly #requiresEmailVerification = (email: string): boolean => {
    if (Constants.env === Env.PRODUCTION) return true;

    const domain = email.split("@")[1];
    return Constants.devEmailVerificationWhitelist.includes(domain);
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
    req.parsedData = validateData(emailSchema, { email: req.params.email });
    next();
  };

  static readonly checkEmailStatus: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const parsedData = req.parsedData! as EmailType;

      const user = await UserDatasource.findUserByEmail(parsedData.email);

      if (user === null) {
        return successResponseHandler({
          res: res,
          status: 200,
          data: { userAction: AuthUserAction.SIGN_UP },
        });
      }

      switch (user.status) {
        case EntityStatus.ACTIVE:
          return successResponseHandler({
            res: res,
            status: 200,
            data: { userAction: AuthUserAction.SIGN_IN },
          });
        case EntityStatus.BANNED:
          return successResponseHandler({
            res: res,
            status: 200,
            data: { userAction: AuthUserAction.BANNED },
          });
        case EntityStatus.REQUESTED_DELETION:
          return successResponseHandler({
            res: res,
            status: 200,
            data: { userAction: AuthUserAction.REQUESTED_DELETION },
          });
      }
    }
  );

  static readonly validateEmailCodeRequest: RequestHandler = (
    req,
    res,
    next
  ) => {
    req.parsedData = validateData(requestEmailCodeSchema, req.body);
    next();
  };

  static readonly sendEmailCode: RequestHandler = asyncHandler(
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
    req.parsedData = validateData(signUpSchema, req.body);
    next();
  };

  static readonly signUp: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const anonymousUserId = req.user?.userId ?? null;

      const parsedData = req.parsedData! as SignUpType;

      await this.#verifyEmailTokenCredentials(
        parsedData.email,
        parsedData.verificationCode,
        parsedData.verificationToken
      );

      if (anonymousUserId !== null) {
        const anonymousUserExists = await UserDatasource.anonymousUserExists(
          anonymousUserId
        );
        if (!anonymousUserExists) {
          throw new CustomError(404, "Anonymous user not found!");
        }
      }

      const emailExists = await UserDatasource.userByEmailExists(
        parsedData.email
      );
      if (emailExists) {
        throw new CustomError(409, "Account with this email already exists.");
      }
      const phoneNumberExists = await UserDatasource.userByPhoneNumberExists(
        parsedData.countryCode,
        parsedData.phoneNumber
      );
      if (phoneNumberExists) {
        throw new CustomError(
          409,
          "Account with this phone number already exists."
        );
      }

      const userData: Prisma.UserCreateInput = {
        firstName: parsedData.firstName,
        lastName: parsedData.lastName,
        gender: parsedData.gender,
        countryCode: parsedData.countryCode,
        phoneNumber: parsedData.phoneNumber,
        email: parsedData.email,
        dob: parsedData.dob,
        profileImagePath: null,
        status: EntityStatus.ACTIVE,
        bannedAt: null,
        deletedAt: null,
      };

      const authToken = await PrismaService.client.$transaction<string>(
        async (tx) => {
          let userId: string;
          if (anonymousUserId !== null) {
            userId = await UserDatasource.convertAnonymousUserToActive(
              anonymousUserId,
              userData,
              tx
            );
          } else {
            userId = await UserDatasource.createUser(userData, tx);
          }
          return await JwtService.createAuthToken(
            userId,
            EntityStatus.ACTIVE,
            parsedData.deviceId,
            parsedData.deviceName,
            parsedData.platform,
            tx
          );
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
    req.parsedData = validateData(signInSchema, req.body);
    next();
  };

  static readonly signIn: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const anonymousUserId = req.user?.userId ?? null;

      const parsedData = req.parsedData! as SignInType;

      await this.#verifyEmailTokenCredentials(
        parsedData.email,
        parsedData.verificationCode,
        parsedData.verificationToken
      );

      if (anonymousUserId !== null) {
        const anonymousUserExists = await UserDatasource.anonymousUserExists(
          anonymousUserId
        );
        if (!anonymousUserExists) {
          throw new CustomError(404, "Anonymous user not found!");
        }
      }

      const user = await UserDatasource.findUserByEmail(parsedData.email);
      if (user === null) {
        throw new CustomError(404, "Account with this email not found.");
      }

      if (user.status === EntityStatus.BANNED) {
        throw new CustomError(
          403,
          "Your account is banned due to violation of our moderation guidelines. Please contact our customer support."
        );
      }

      // Checking if the user is marked for deletion
      if (
        user.status === EntityStatus.REQUESTED_DELETION &&
        !parsedData.cancelAccountDeletionRequest
      ) {
        throw new CustomError(
          403,
          "You have an active account deletion request pending."
        );
      }

      const authToken = await PrismaService.client.$transaction<string>(
        async (tx) => {
          if (parsedData.cancelAccountDeletionRequest) {
            await UserDatasource.removeDeletionRequest(user.id!, tx);
            await UserDatasource.setUserAsActive(user.id!, tx);
          }
          // Delete anonymous user (if exists)
          if (anonymousUserId !== null) {
            await SessionDatasource.signOutAllSessions(anonymousUserId!, tx);
            await UserDatasource.deleteAnonymousUser(anonymousUserId!, tx);
          }
          return await JwtService.createAuthToken(
            user.id!,
            EntityStatus.ACTIVE,
            parsedData.deviceId,
            parsedData.deviceName,
            parsedData.platform,
            tx
          );
        }
      );

      successResponseHandler({
        res: res,
        status: 200,
        data: { authToken: authToken },
      });
    }
  );

  static readonly refreshAuthToken: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const refreshToken = JwtService.getRefreshToken(req.user!);

      successResponseHandler({
        res: res,
        status: 200,
        data: { refreshToken: refreshToken },
      });
    }
  );

  static readonly validateAnonymousAuthRequest: RequestHandler = (
    req,
    res,
    next
  ) => {
    req.parsedData = validateData(anonymousAuthSchema, req.body);
    next();
  };

  static readonly anonymousAuth: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const parsedData = req.parsedData! as AnonymousAuthType;

      const userData: Prisma.UserCreateInput = {
        status: EntityStatus.ANONYMOUS,
      };

      const authToken = await PrismaService.client.$transaction<string>(
        async (tx) => {
          const userId = await UserDatasource.createUser(userData, tx);
          return await JwtService.createAuthToken(
            userId,
            EntityStatus.ANONYMOUS,
            parsedData.deviceId,
            parsedData.deviceName,
            parsedData.platform,
            tx
          );
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
