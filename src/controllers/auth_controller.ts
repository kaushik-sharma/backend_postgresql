import { RequestHandler } from "express";

import { asyncHandler } from "../helpers/async_handler.js";
import {
  phoneNumberSchema,
  PhoneNumberType,
  signInSchema,
  SignInType,
  signUpSchema,
  SignUpType,
} from "../validation/auth_schema.js";
import { validateModel } from "../helpers/validation_helper.js";
import AuthDatasource from "../datasources/auth_datasource.js";
import { successResponseHandler } from "../helpers/success_handler.js";
import { AuthUserAction, EntityStatus } from "../constants/enums.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import JwtService from "../services/jwt_service.js";
import { UserModel } from "../models/auth/user_model.js";
import { performTransaction } from "../helpers/transaction_helper.js";
import BcryptService from "../services/bcrypt_service.js";
import ProfileDatasource from "../datasources/profile_datasource.js";

export class AuthController {
  static readonly validatePhoneNumberRequest: RequestHandler = (
    req,
    res,
    next
  ) => {
    req.parsedData = validateModel(phoneNumberSchema, req.body);
    next();
  };

  static readonly checkPhoneNumber: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const parsedData = req.parsedData! as PhoneNumberType;

      const user = await AuthDatasource.findUserByPhoneNumber(
        parsedData.countryCode,
        parsedData.phoneNumber
      );

      if (user === null) {
        return successResponseHandler({
          res: res,
          status: 200,
          data: { userAction: AuthUserAction.signUp },
        });
      }

      // Check if there is an active account deletion request pending
      const deletionRequestExists =
        await ProfileDatasource.userDeletionRequestExists(user.id);
      if (deletionRequestExists) {
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

      const user = new UserModel({
        firstName: parsedData.firstName,
        lastName: parsedData.lastName,
        gender: parsedData.gender,
        countryCode: parsedData.countryCode,
        phoneNumber: parsedData.phoneNumber,
        email: parsedData.email,
        dob: parsedData.dob,
        password: parsedData.password,
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

      const user = await AuthDatasource.findUserByPhoneNumber(
        parsedData.countryCode,
        parsedData.phoneNumber
      );

      if (user === null) {
        throw new CustomError(
          404,
          "Account with this phone number does not exist."
        );
      }

      const enteredPassword: string = parsedData.password;
      const savedPassword: string = user.password!;
      const isEqual = await BcryptService.compare(
        enteredPassword,
        savedPassword
      );
      if (!isEqual) {
        throw new CustomError(401, "Incorrect password.");
      }

      if (user!.status === EntityStatus.banned) {
        throw new CustomError(
          403,
          "Your account is banned due to violation of our moderation guidelines. Please contact our customer support."
        );
      }

      if (parsedData.cancelAccountDeletionRequest) {
        await ProfileDatasource.cancelUserDeletionRequest(user.id);
      }

      // Check if there is an active account deletion request pending
      const deletionRequestExists =
        await ProfileDatasource.userDeletionRequestExists(user.id);
      if (deletionRequestExists) {
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
