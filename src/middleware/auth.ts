import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { env } from "~/env";
import type { AppEnv } from "~/types";
import { apiError } from "~/utils/error";

export const requiredApiKey = createMiddleware<AppEnv>(async (c, next) => {
	if (!env.API_KEY) {
		await next();
		return;
	}

	const authentication = c.req.header("Authorization");
	const apiKey = authentication?.split(" ")[1];
	if (!apiKey || apiKey !== env.API_KEY) {
		throw apiError({
			name: "UNAUTHORIZED",
			message: "Invalid API key",
			statusCode: HttpStatusCodes.UNAUTHORIZED,
		});
	}

	await next();
});
