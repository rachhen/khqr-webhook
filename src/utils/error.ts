import type { ErrorHandler, NotFoundHandler } from "hono/types";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { NOT_FOUND } from "stoker/http-status-codes";
import { NOT_FOUND as NOT_FOUND_MESSAGE } from "stoker/http-status-phrases";

import type { AppEnv } from "~/types";

export const ERROR = [
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "INTERNAL_SERVER_ERROR",
  "EXPECTATION_FAILED",
] as const;

export type NamedError = (typeof ERROR)[number];

interface ApiErrorOptions {
  name: NamedError;
  code?: any;
  statusCode: ContentfulStatusCode;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  statusCode: ContentfulStatusCode;
  details?: unknown;
  name: NamedError = "INTERNAL_SERVER_ERROR";
  code?: any;

  constructor({ name, code, statusCode, message, details }: ApiErrorOptions) {
    super(message);

    this.name = name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function apiError(options: ApiErrorOptions) {
  return new ApiError(options);
}

export const onError: ErrorHandler<AppEnv> = (err, c) => {
  console.error(err);
  if (err instanceof ApiError) {
    const { name, code, message, statusCode, details } = err;
    return c.json({ name, code, message, details }, statusCode);
  }

  return c.json(
    {
      name: "INTERNAL_SERVER_ERROR",
      message: err.message,
      // stack: c.env.NODE_ENV === "production" ? undefined : err.stack,
    },
    500
  );
};

export const notFound: NotFoundHandler = (c) => {
  return c.json(
    {
      name: "NOT_FOUND",
      message: NOT_FOUND_MESSAGE,
    },
    NOT_FOUND
  );
};
