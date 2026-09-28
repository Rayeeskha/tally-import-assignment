import { NextFunction, Request, Response } from "express";
import multer, { Multer } from "multer";
import { ERRORS, HTTP_STATUS } from "../constants";
import { getTallyUploadConfig } from "../config/tally-upload.config";
import {
  acceptXmlUpload,
  ensureUploadDirectory,
  generateUploadFilename,
} from "../utils/tally-upload.utils";

export function createTallyUploadMiddleware(): Multer {
  const config = getTallyUploadConfig();
  return multer({
    storage: multer.diskStorage({
      destination: (_request, _file, callback) => ensureUploadDirectory(config.directory, callback),
      filename: generateUploadFilename,
    }),
    limits: { fileSize: config.maxBytes, files: 1, fields: 0 },
    fileFilter: acceptXmlUpload,
  });
}

export const tallyUpload = createTallyUploadMiddleware();

export function requireTallyFile(request: Request, _response: Response, next: NextFunction): void {
  if (!request.file) {
    next(
      Object.assign(new Error(ERRORS.MULTIPART_FILE_REQUIRED), {
        statusCode: HTTP_STATUS.BAD_REQUEST,
      }),
    );
    return;
  }
  next();
}

export function tallyRequestTimeout(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  request.setTimeout(getTallyUploadConfig().requestTimeoutMs);
  next();
}
