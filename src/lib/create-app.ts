import { OpenAPIHono } from "@hono/zod-openapi";
import { secureHeaders } from "hono/secure-headers";
import { serveEmojiFavicon } from "stoker/middlewares";
import type { AppEnv } from "~/types";

import { defaultHook } from "~/utils/default-hook";
import { notFound, onError } from "~/utils/error";

export function createRouter() {
	return new OpenAPIHono<AppEnv>({
		strict: true,
		defaultHook,
	});
}

export function createApp() {
	const app = createRouter();

	app.use(serveEmojiFavicon("📝"));

	app.use(secureHeaders());

	app.notFound(notFound);
	app.onError(onError);

	return app;
}
