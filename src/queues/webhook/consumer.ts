import { Worker } from "bullmq";

import { logger } from "~/lib/register-logger";
import { type Consumer, DEFAULT_CONNECTION } from "~/lib/register-queue";
import {
	WEBHOOK_QUEUE_NAME,
	type WebhookJob,
	type WebhookJobData,
} from "./producer";

export class WebhookConsumer implements Consumer {
	worker;

	constructor() {
		this.worker = new Worker<WebhookJobData>(WEBHOOK_QUEUE_NAME, this.process, {
			autorun: false,
			connection: DEFAULT_CONNECTION,
			concurrency: 20,
		});

		this.worker.on("ready", () => {
			console.log("Webhook worker is ready ✅");
		});

		this.worker.on("closing", () => {
			console.log("Webhook worker is closing");
		});
	}

	async start() {
		await this.worker.run();
	}

	async shutdown() {
		await this.worker.close();
	}

	async process(job: WebhookJob) {
		const headers = new Headers();
		headers.set("Content-Type", "application/json");

		const resp = await fetch(job.data.webhookUrl, {
			method: "POST",
			headers,
			body: JSON.stringify({
				status: job.data.status,
				data: job.data.data,
				md5: job.data.md5,
				jobId: job.data.jobId,
			}),
		});

		if (!resp.ok) {
			job.log(`Webhook return with http error ${resp.status}`);
			logger.error({ response: resp }, "Failed to send webhook http error");
			throw new Error(`Webhook return with http error ${resp.status}`);
		}

		try {
			const json = await resp.json();
			job.log("Webhook sent successfully");
			logger.info({ response: resp, json }, "Webhook sent successfully");
			job.updateProgress(100);
		} catch (error) {
			console.log("Error parsing webhook response", error);
			logger.info({ response: resp }, "Error parsing webhook response");
		}
	}
}
