import pino from "pino";
import type { AppHono } from "~/types";

// const axiomTransport = pino.transport({
//   target: "@axiomhq/pino",
//   options: {
//     dataset: env.AXIOM_DATASET,
//     token: env.AXIOM_TOKEN,
//   },
// });

const pinoPrettyTransport = pino.transport({
	target: "pino-pretty",
});

// const pinoTransport =
//   env.NODE_ENV === "production" ? axiomTransport : pinoPrettyTransport;

export const logger = pino({ level: "info" }, pinoPrettyTransport);

export function registerLogger(app: AppHono) {
	app.use(async (c, next) => {
		const startTime = performance.now();
		await next();
		const endTime = performance.now();

		const query = c.req.query();
		const status = c.res.status;

		const duration = Math.round(endTime - startTime) * 1000_000;

		const resOut = {
			status,
			method: c.req.method,
			path: c.req.path,
			query,
			duration,
			// body,
		};

		logger.info(resOut);
	});
}
