import { Request, Response, NextFunction } from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import { ERRORS, HTTP_STATUS } from "../constants";

export const errorMiddleware = (
  error: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const isMulterError = error instanceof multer.MulterError;
  const isJwtError = error instanceof jwt.JsonWebTokenError;
  const isUploadFieldError =
    isMulterError &&
    [
      "LIMIT_FILE_COUNT",
      "LIMIT_FIELD_COUNT",
      "LIMIT_PART_COUNT",
      "LIMIT_UNEXPECTED_FILE",
      "LIMIT_FIELD_KEY",
      "LIMIT_FIELD_VALUE",
    ].includes(error.code);
  const statusCode =
    isMulterError && error.code === "LIMIT_FILE_SIZE"
      ? 413
      : isUploadFieldError
        ? HTTP_STATUS.BAD_REQUEST
        : isJwtError
          ? HTTP_STATUS.UNAUTHORIZED
          : error.statusCode && error.statusCode >= 400 && error.statusCode < 500
            ? error.statusCode
            : HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message =
    isMulterError && error.code === "LIMIT_FILE_SIZE"
      ? ERRORS.UPLOAD_SIZE_EXCEEDED
      : isUploadFieldError
        ? ERRORS.UPLOAD_FIELD_INVALID
        : isJwtError
          ? ERRORS.INVALID_TOKEN
          : statusCode < 500
            ? error.message
            : ERRORS.INTERNAL_SERVER;
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
