import { RequestHandler } from "express";
import multer from "multer";

import {
  MAX_IMAGE_FILE_SIZE_IN_BYTES,
  ALLOWED_IMAGE_MIMETYPES,
} from "../constants/values.js";
import { CustomError } from "./error_middlewares.js";

export const createSingleImageUploadMiddleware = (
  fieldName: string
): RequestHandler => {
  const uploadImage = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAX_IMAGE_FILE_SIZE_IN_BYTES,
    },
    fileFilter: (req, file, callback) => {
      const isAllowed = ALLOWED_IMAGE_MIMETYPES.includes(file.mimetype);
      if (isAllowed) {
        return callback(null, true);
      } else {
        return callback(
          new CustomError(
            415,
            "Invalid file type. Only images and gifs are allowed."
          )
        );
      }
    },
  }).single(fieldName);

  return (req, res, next) => {
    uploadImage(req, res, (err) => {
      if (err) {
        // Resume the request stream to drain any remaining data
        req.resume();

        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new CustomError(413, "File size is too large!"));
        }
        return next(err);
      }
      next();
    });
  };
};
