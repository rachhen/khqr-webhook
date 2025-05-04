import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { type ConnectionOptions, Queue, type Worker } from "bullmq";
import { serveStatic } from "hono/bun";

import { env } from "~/env";
import type { AppHono } from "~/types";

export const BASIC_AUTH = {
	username: "admin",
	password: "admin",
};

export function registerQueues(app: AppHono, consumers: Consumer[]) {
	// start all consumers
	for (const consumer of consumers) {
		consumer.start();
	}

	if (env.NODE_ENV !== "production") {
		const serverAdapter = new HonoAdapter(serveStatic);

		createBullBoard({
			queues: consumers.map(createBullAdapter),
			serverAdapter,
		});

		serverAdapter.setBasePath("/queue");

		app
			// .use("/queue", basicAuth(BASIC_AUTH))
			.route("/queue", serverAdapter.registerPlugin());
	}
}

function createBullAdapter(consumer: Consumer) {
	return new BullMQAdapter(
		new Queue(consumer.worker.name, {
			connection: DEFAULT_CONNECTION,
		}),
	);
}

export const DEFAULT_CONNECTION: ConnectionOptions = {
	url: env.REDIS_URL,
};

export interface Consumer {
	worker: Worker;
	start(): Promise<void>;
	shutdown(): Promise<void>;
}
