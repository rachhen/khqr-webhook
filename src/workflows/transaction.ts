import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";

import { getKhqrToken, setKhqrToken } from "~/utils/cache";
import { generateNewToken, getTransactionByMd5 } from "~/utils/khqr";

// User-defined params passed to your workflow
type Params = {
  webhookUrl: string;
  md5: string;
};

export class TrxWorkflow extends WorkflowEntrypoint<
  CloudflareBindings,
  Params
> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    // Can access bindings on `this.env`
    // Can access params on `event.payload`
    const timeoutInMinutes = Number(this.env.TIMEOUT_IN_MINUTES ?? "5");
    const { md5, webhookUrl } = event.payload;

    const token = await step.do(
      "get new token",
      // Define a retry strategy
      {
        retries: {
          limit: 3,
          delay: "5 second",
          backoff: "constant",
        },
        timeout: "5 minutes",
      },
      async () => {
        // get token from KV
        const token = await getKhqrToken(this.env);
        if (token) {
          console.log("✅ Token found in cache");
          return token;
        }

        const newToken = await generateNewToken(
          this.env.BAKONG_REGISTERED_EMAIL
        );

        if (newToken.error) {
          console.log("❌ Failed to generate new token", newToken.error);
          throw new NonRetryableError(newToken.error.message);
        }

        this.ctx.waitUntil(setKhqrToken(this.env, newToken.value));

        return newToken.value.token;
      }
    );

    await step.do(
      `check transaction ${md5} status`,
      // Define a retry strategy
      {
        retries: {
          limit: 3,
          delay: "5 second",
          backoff: "constant",
        },
        timeout: "10 minutes",
      },
      async () => {
        const TIMEOUT = 1000 * 60 * timeoutInMinutes;
        let retriesAttempt = 0;

        while (true) {
          // if the workflow age exceeds 5mn, it will be considered failed
          if (event.timestamp.getTime() + TIMEOUT < Date.now()) {
            console.log("❌ Transaction Expired");
            await this.env.WEBHOOK_WORKFLOW.create({
              id: event.payload.md5,
              params: { webhookUrl, md5, status: "expired", data: null },
            });
            break;
          }

          const khqrTrx = await getTransactionByMd5(token, event.payload.md5);

          if (khqrTrx.error) {
            console.log(
              `Failed to get transaction ${md5} status: ${khqrTrx.error.message}`
            );

            await sleep(5000);
            retriesAttempt++;
            continue; // retry the workflow
          }

          // if we get error code
          if (khqrTrx.value.responseCode === 1) {
            // error code 1 means transaction failed
            if (khqrTrx.value.errorCode === 3) {
              // Send webhook to the failure webhook
              await this.env.WEBHOOK_WORKFLOW.create({
                id: event.payload.md5,
                params: {
                  webhookUrl: event.payload.webhookUrl,
                  md5: event.payload.md5,
                  status: "failed",
                  data: null,
                },
              });

              console.log(
                `❌ Transaction ${md5} failed: ${khqrTrx.value.responseMessage}`
              );
              break;
            }

            if (retriesAttempt > 0) {
              await sleep(5000);
            }

            // otherwise, it's not found
            retriesAttempt++;
            console.log(
              `🔃 Transaction ${md5} not found, attempt number: ${retriesAttempt}`
            );
            continue;
          }

          // if we get success code
          if (khqrTrx.value.responseCode === 0) {
            // Send webhook to the success webhook
            console.log(`✅ Transaction ${md5} success`);
            await this.env.WEBHOOK_WORKFLOW.create({
              id: event.payload.md5,
              params: {
                webhookUrl,
                md5,
                status: "success",
                data: khqrTrx.value.data,
              },
            });
            break;
          }

          // if we get unknown code
          console.log(`❌ An unknown error occurs on transaction ${md5}`);
        }
      }
    );
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
