import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { WorkflowEntrypoint } from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";

import type { KhqrTransactionSuccess } from "~/types/khqr";

interface Params {
  webhookUrl: string;
  md5: string;
  status: "success" | "failed" | "expired";
  data: KhqrTransactionSuccess["data"];
}

export class WebhookWorkflow extends WorkflowEntrypoint<
  CloudflareBindings,
  Params
> {
  async run(event: Readonly<WorkflowEvent<Params>>, step: WorkflowStep) {
    await step.do(
      "call webhook",
      {
        retries: {
          limit: 3,
          delay: "10 seconds",
          backoff: "exponential",
        },
        timeout: "5 minutes",
      },
      async () => {
        const headers = new Headers();
        headers.set("X-Webhook-Signature", this.env.WEBHOOK_SECRET_KEY);
        headers.set("Content-Type", "application/json");

        const resp = await fetch(event.payload.webhookUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            status: event.payload.status,
            data: event.payload.data,
            md5: event.payload.md5,
          }),
        });

        if (!resp.ok) {
          console.log("Error calling webhook", resp.status);
          throw new NonRetryableError(
            `Webhook return with http error ${resp.status}`
          );
        }

        try {
          const json = await resp.json<Record<string, any>>();
          console.log("Webhook response", JSON.stringify(json, null, 2));
          return json;
        } catch (error) {
          console.log("Error parsing webhook response", error);
        }
      }
    );
  }
}
