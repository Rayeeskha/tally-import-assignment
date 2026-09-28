import { NextFunction, Request, RequestHandler, Response } from "express";

export type AsyncHandlerHooks = {
  onStart?: (request: Request) => void | Promise<void>;
  onSuccess?: (request: Request, result: unknown) => void | Promise<void>;
  onError?: (request: Request, error: unknown) => void | Promise<void>;
  onFinally?: (request: Request) => void | Promise<void>;
};

export function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => unknown,
  hooks: AsyncHandlerHooks = {},
): RequestHandler {
  return (request, response, next) => {
    Promise.resolve()
      .then(() => hooks.onStart?.(request))
      .then(() => handler(request, response, next))
      .then(async (result) => {
        await hooks.onSuccess?.(request, result);
        return result;
      })
      .catch(async (error: unknown) => {
        try {
          await hooks.onError?.(request, error);
        } finally {
          next(error);
        }
      })
      .finally(() => hooks.onFinally?.(request));
  };
}
