import { type Job, Queue } from "bullmq";

import { DEFAULT_CONNECTION } from "~/lib/register-queue";

export const TRANSACTION_QUEUE_NAME = "{transaction}";

const DELAY = 5000;
const MAXIMUM_ATTEMPTS = 120;
const REMOVE_ON_FAIL = { count: 8500 };
const REMOVE_ON_SUCCESS = { count: 5500 };
const BACKOFF = { type: "fixed", delay: 3200 };

export type TransactionJobData = {
  md5: string;
  jobId: string;
  webhookUrl: string;
  token: string;
};

export type TransactionJob = Job<TransactionJobData>;

export class TransactionProducer {
  queue;

  constructor() {
    this.queue = new Queue<TransactionJobData>(TRANSACTION_QUEUE_NAME, {
      connection: DEFAULT_CONNECTION,
    });
  }

  async add(data: TransactionJobData) {
    return await this.queue.add(TRANSACTION_QUEUE_NAME, data, {
      jobId: data.jobId,
      delay: DELAY,
      backoff: BACKOFF,
      attempts: MAXIMUM_ATTEMPTS,
      removeOnFail: REMOVE_ON_FAIL,
      removeOnComplete: REMOVE_ON_SUCCESS,
    });
  }
}

export const transactionQueue = new TransactionProducer();
