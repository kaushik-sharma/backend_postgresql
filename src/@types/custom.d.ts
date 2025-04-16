import { Request } from "express";

interface AuthenticatedUser {
  userId: string;
  sessionId: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
    parsedData?: any;
  }
}
