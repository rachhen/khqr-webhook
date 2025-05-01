import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppEnv } from "~/types";
import { apiError } from "~/utils/error";

export const requiredApiKey = createMiddleware<AppEnv>(async (c, next) => {
  const authorization = c.req.header("Authorization");

  const token = authorization?.split(" ")[1]; // Bearer tokentokentoken...

  if (!token) {
    throw apiError({
      name: "UNAUTHORIZED",
      message: "Unauthorized",
      statusCode: HttpStatusCodes.UNAUTHORIZED,
    });
  }

  if (token !== c.env.API_KEY) {
    throw apiError({
      name: "UNAUTHORIZED",
      message: "Unauthorized",
      statusCode: HttpStatusCodes.UNAUTHORIZED,
    });
  }

  await next();
});
