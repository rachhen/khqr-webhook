import { type Job, Queue } from "bullmq";

import { DEFAULT_CONNECTION } from "~/lib/register-queue";
import type { KhqrTransactionSuccess } from "~/types/khqr";
import { err, ok } from "~/utils/result";

export const WEBHOOK_QUEUE_NAME = "{webhook}";

const REMOVE_ON_FAIL = { count: 8500 };
const REMOVE_ON_SUCCESS = { count: 5500 };
const BACKOFF = { type: "exponential", delay: 500 };
const ATTMEPTS = 5;

export type WebhookJobData =
	| {
			jobId: string;
			webhookUrl: string;
			md5: string;
			status: "failed" | "timeout";
			data: KhqrTransactionSuccess["data"] | null;
	  }
	| {
			jobId: string;
			webhookUrl: string;
			md5: string;
			status: "success";
			data: KhqrTransactionSuccess["data"];
	  };

export type WebhookJob = Job<WebhookJobData>;

class WebhookProducer {
	queue;

	constructor() {
		this.queue = new Queue<WebhookJobData>(WEBHOOK_QUEUE_NAME, {
			connection: DEFAULT_CONNECTION,
		});
	}

	async add(opts: WebhookJobData) {
		const job = await this.queue.getJob(opts.jobId);

		if (job) {
			const isFailed = await job.isFailed().then(ok).catch(err);
			if (isFailed.error) return isFailed;

			job.retry("failed");

			return ok(job);
		}

		return this.queue
			.add(WEBHOOK_QUEUE_NAME, opts, {
				jobId: opts.jobId,
				attempts: ATTMEPTS,
				backoff: BACKOFF,
				removeOnFail: REMOVE_ON_FAIL,
				removeOnComplete: REMOVE_ON_SUCCESS,
			})
			.then(ok)
			.catch(err);
	}
}

export const webhookQueue = new WebhookProducer();
