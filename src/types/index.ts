import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";

export interface AppEnv {
	Bindings: CloudflareBindings;
	// Variables: {};
}

export type AppHono = OpenAPIHono<AppEnv>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppEnv>;
