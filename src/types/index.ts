import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";

export type AppEnv = {
	// Bindings: CloudflareBindings;
	Variables: {
		HELLO: string;
	};
};

export type AppHono = OpenAPIHono<AppEnv>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppEnv>;
