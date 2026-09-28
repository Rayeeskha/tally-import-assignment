import path from "node:path";
import { ERRORS } from "../constants";

export type TallyUploadConfig = {
  directory: string;
  maxBytes: number;
  requestTimeoutMs: number;
};

export function getTallyUploadConfig(): TallyUploadConfig {
  const maxBytes = Number(process.env.TALLY_MAX_UPLOAD_BYTES);
  const requestTimeoutMs = Number(process.env.TALLY_REQUEST_TIMEOUT_MS);
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0)
    throw new Error(ERRORS.UPLOAD_LIMIT_NOT_CONFIGURED);
  if (!Number.isSafeInteger(requestTimeoutMs) || requestTimeoutMs <= 0)
    throw new Error(ERRORS.REQUEST_TIMEOUT_NOT_CONFIGURED);
  return {
    directory: path.resolve(
      process.env.TALLY_UPLOAD_DIRECTORY || path.join(process.cwd(), "data", "uploads"),
    ),
    maxBytes,
    requestTimeoutMs,
  };
}
