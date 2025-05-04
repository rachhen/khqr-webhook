import { UnrecoverableError, Worker } from "bullmq";

import { logger } from "~/lib/register-logger";
import { type Consumer, DEFAULT_CONNECTION } from "~/lib/register-queue";
import { getTransactionByMd5 } from "~/utils/khqr";
import { webhookQueue } from "../webhook";
import {
  TRANSACTION_QUEUE_NAME,
  type TransactionJob,
  type TransactionJobData,
} from "./producer";

export class TransactionConsumer implements Consumer {
  worker;

  constructor() {
    this.worker = new Worker<TransactionJobData>(
      TRANSACTION_QUEUE_NAME,
      this.process,
      {
        autorun: false,
        connection: DEFAULT_CONNECTION,
        concurrency: 20,
      }
    );

    this.worker.on("ready", () => {
      console.log("Transaction worker is ready ✅");
    });

    this.worker.on("closing", () => {
      console.log("Transaction worker is closing");
    });
  }

  async start() {
    await this.worker.run();
  }

  async shutdown() {
    await this.worker.close();
  }

  async process(job: TransactionJob) {
    // if the job age exceeds 5mn, it will be considered failed
    const TIMEOUT = 1000 * 60 * 5;
    if (job.timestamp + TIMEOUT < Date.now()) {
      // Send webhook to user that the transaction is expired
      // Send webhook to user that the transaction is timeout
      await webhookQueue.add({
        data: null,
        status: "timeout",
        md5: job.data.md5,
        jobId: job.data.jobId,
        webhookUrl: job.data.webhookUrl,
      });

      job.log("Transaction Expired");
      throw new UnrecoverableError("Transaction Expired");
    }

    const transactionStatus = await getTransactionByMd5(
      job.data.token,
      job.data.md5
    );

    if (transactionStatus.error) {
      job.log(
        `Failed to get transaction status: ${transactionStatus.error.message}`
      );
      logger.error(transactionStatus.error, "Failed to get transaction status");
      throw transactionStatus.error;
    }

    // if we get error code
    if (transactionStatus.value.responseCode === 1) {
      // error code 1 means transaction failed
      if (transactionStatus.value.errorCode === 3) {
        // Send webhook to user that the transaction is failed
        await webhookQueue.add({
          data: null,
          status: "failed",
          md5: job.data.md5,
          jobId: job.data.jobId,
          webhookUrl: job.data.webhookUrl,
        });

        job.log(
          `Transaction failed: ${transactionStatus.value.responseMessage}`
        );
        logger.error(transactionStatus.value, "Transaction failed");
        throw new UnrecoverableError(transactionStatus.value.responseMessage);
      }

      // otherwise, it's not found
      job.log(`Transaction not found, attempt number: ${job.attemptsStarted}`);
      throw new Error(transactionStatus.value.responseMessage);
    }

    // Send webhook to user that the transaction is successful
    await webhookQueue.add({
      status: "success",
      md5: job.data.md5,
      jobId: job.data.jobId,
      data: transactionStatus.value.data,
      webhookUrl: job.data.webhookUrl,
    });

    await job.updateProgress(100);
    job.log("Transaction is successful");
  }
}
