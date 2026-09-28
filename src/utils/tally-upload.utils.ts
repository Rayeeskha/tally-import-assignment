import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { Request } from "express";
import { FileFilterCallback } from "multer";
import { ERRORS } from "../constants";

const XML_MIME_TYPES = new Set(["application/xml", "text/xml", "application/octet-stream", ""]);

export function acceptXmlUpload(
  _request: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
): void {
  if (!XML_MIME_TYPES.has(file.mimetype.toLowerCase())) {
    callback(Object.assign(new Error(ERRORS.XML_UPLOADS_ONLY), { statusCode: 400 }));
    return;
  }
  callback(null, true);
}
export function ensureUploadDirectory(
  directory: string,
  callback: (error: Error | null, destination: string) => void,
): void {
  fs.mkdir(directory, { recursive: true }, (error) => callback(error, directory));
}
export function generateUploadFilename(
  _request: Request,
  _file: Express.Multer.File,
  callback: (error: Error | null, filename: string) => void,
): void {
  callback(null, `${randomUUID()}.xml`);
}
