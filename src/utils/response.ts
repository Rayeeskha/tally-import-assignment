import { Response } from "express";

export function successResponse(res: Response, status: number, message: string, data?: unknown) {
  return res.status(status).json({
    success: true,
    message,
    ...(data !== undefined && { data }),
  });
}

export function errorResponse(res: Response, status: number, message: string, error?: unknown) {
  return res.status(status).json({
    success: false,
    message,
    ...(error !== undefined && { error }),
  });
}

export function resourceResponse<T>(res: Response, status: number, resource: T) {
  return res.status(status).json({
    success: true,
    data: resource,
  });
}
