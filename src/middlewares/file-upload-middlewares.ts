import { RequestHandler } from "express";
import multer from "multer";

import { Constants } from "../constants/constants.js";
import { CustomError } from "./error-middlewares.js";

export const createSingleImageUploadMiddleware = ({
  fieldName,
}: {
  fieldName: string;
}): RequestHandler => {
  const uploadImage = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: Constants.maxImageFileSizeInBytes,
    },
    fileFilter: (req, file, callback) => {
      const isAllowed = Constants.allowedImageMimetypes.includes(file.mimetype);
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
