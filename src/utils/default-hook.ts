import type { Hook } from "@hono/zod-openapi";

import { UNPROCESSABLE_ENTITY } from "stoker/http-status-codes";

import { ApiError } from "./error";

export const defaultHook: Hook<any, any, any, any> = (result, c) => {
  if (!result.success) {
    const err = new ApiError({
      code: "VALIDATION_ERROR",
      status: UNPROCESSABLE_ENTITY,
      message: "Validation error(s)",
      details: result.error.flatten().fieldErrors,
    });

    return c.json(err, UNPROCESSABLE_ENTITY);
  }
};
