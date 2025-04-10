import { RequestHandler } from "express";

import { UserModel, UserType } from "../models/auth/user_model.js";
import { successResponseHandler } from "../helpers/custom_handlers.js";
import { validateModel } from "../helpers/validation_helpers.js";
import AuthDatasource from "../datasources/auth_datasource.js";
import JwtService from "../services/jwt_service.js";
import {
  AuthUserAction,
  PhoneNumberModel,
  PhoneNumberType,
  SignInModel,
  SignInType,
} from "../models/auth/sign_in_model.js";
import BcryptService from "../services/bcrypt_service.js";
import { performTransaction } from "../helpers/transaction_helper.js";
import { AnonymousUserModel } from "../models/auth/anonymous_user_model.js";
import { asyncHandler } from "../helpers/exception_handlers.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import ProfileDatasource from "../datasources/profile_datasource.js";
import { EntityStatus } from "../constants/enums.js";

export const validatePhoneNumberRequest: RequestHandler = (req, res, next) => {
  const phoneNumberModel = new PhoneNumberModel(req.body as PhoneNumberType);
  validateModel(phoneNumberModel);
  next();
};

export const checkPhoneNumber: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const phoneNumberModel = new PhoneNumberModel(req.body as PhoneNumberType);

    const user = await AuthDatasource.findUserByPhoneNumber(
      phoneNumberModel.countryCode,
      phoneNumberModel.phoneNumber
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
      await ProfileDatasource.userDeletionRequestExists(user._id);
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

export const validateSignUpRequest: RequestHandler = (req, res, next) => {
  const newUser = new UserModel(req.body as UserType);
  validateModel(newUser);
  next();
};

export const signUp: RequestHandler = asyncHandler(async (req, res, next) => {
  const anonymousUserId = req.user?.userId ?? null;

  const newUser = new UserModel(req.body as UserType);

  const email = newUser.email;
  const countryCode = newUser.countryCode;
  const phoneNumber = newUser.phoneNumber;

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

  const authToken = await performTransaction<string>(async (session) => {
    /// Delete anonymous user (if exists)
    if (anonymousUserId !== null) {
      await AuthDatasource.signOutAllSessions(anonymousUserId, session);
      await AuthDatasource.deleteAnonymousUser(anonymousUserId, session);
    }
    const userId = await AuthDatasource.createUser(newUser, session);
    return await JwtService.getAuthToken(userId, session);
  });

  successResponseHandler({
    res: res,
    status: 200,
    data: { authToken: authToken },
  });
});

export const validateSignInRequest: RequestHandler = (req, res, next) => {
  const signInModel = new SignInModel(req.body as SignInType);
  validateModel(signInModel);
  next();
};

export const signIn: RequestHandler = asyncHandler(async (req, res, next) => {
  const anonymousUserId = req.user?.userId ?? null;

  const signInModel = new SignInModel(req.body as SignInType);

  const user = await AuthDatasource.findUserByPhoneNumber(
    signInModel.countryCode,
    signInModel.phoneNumber
  );

  if (user === null) {
    throw new CustomError(
      404,
      "Account with this phone number does not exist."
    );
  }

  const enteredPassword = signInModel.password;
  const savedPassword = user.password;
  const isEqual = await BcryptService.compare(enteredPassword, savedPassword);
  if (!isEqual) {
    throw new CustomError(401, "Incorrect password.");
  }

  if (user!.status === EntityStatus.banned) {
    throw new CustomError(
      403,
      "Your account is banned due to violation of our moderation guidelines. Please contact our customer support."
    );
  }

  if (signInModel.cancelAccountDeletionRequest) {
    await ProfileDatasource.cancelUserDeletionRequest(user._id);
    // TODO: Cancel Cron Job
  }

  // Check if there is an active account deletion request pending
  const deletionRequestExists =
    await ProfileDatasource.userDeletionRequestExists(user._id);
  if (deletionRequestExists) {
    throw new CustomError(
      403,
      "You have an active account deletion request pending."
    );
  }

  const authToken = await performTransaction<string>(async (session) => {
    /// Delete anonymous user (if exists)
    if (anonymousUserId !== null) {
      await AuthDatasource.signOutAllSessions(anonymousUserId!, session);
      await AuthDatasource.deleteAnonymousUser(anonymousUserId!, session);
    }
    return await JwtService.getAuthToken(user._id, session);
  });

  successResponseHandler({
    res: res,
    status: 200,
    data: { authToken: authToken },
  });
});

export const signOut: RequestHandler = asyncHandler(async (req, res, next) => {
  const { userId, sessionId } = req.user!;

  await AuthDatasource.signOutSession(userId, sessionId);

  successResponseHandler({
    res: res,
    status: 200,
  });
});

export const signOutAllSessions: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const userId = req.user!.userId;

    await AuthDatasource.signOutAllSessions(userId);

    successResponseHandler({
      res: res,
      status: 200,
    });
  }
);

export const refreshAuthToken: RequestHandler = asyncHandler(
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

export const anonymousAuth: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const user = new AnonymousUserModel();

    const authToken = await performTransaction<string>(async (session) => {
      const userId = await AuthDatasource.createAnonymousUser(user, session);
      return await JwtService.getAuthToken(userId, session);
    });

    successResponseHandler({
      res: res,
      status: 200,
      data: { authToken: authToken },
    });
  }
);
