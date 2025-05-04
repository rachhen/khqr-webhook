import { createApp } from "./lib/create-app";
import { registerOpenAPI } from "./lib/register-openapi";
import { registerQueues } from "./lib/register-queue";
import { TransactionConsumer } from "./queues/transaction";
import { WebhookConsumer } from "./queues/webhook";
import transaction from "./routes/transaction/transaction.index";

const app = createApp();

registerQueues(app, [new TransactionConsumer(), new WebhookConsumer()]);
registerOpenAPI(app);

app.get("/error", (c) => {
  throw new Error("Ops!");
});

app.route("/api/v1", transaction);

export default app;
