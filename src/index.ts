import { createApp } from "./lib/create-app";
import { registerOpenAPI } from "./lib/register-openapi";
import transaction from "./routes/transaction/transaction.index";

export * from "./workflows";

const app = createApp();

registerOpenAPI(app);

app.get("/error", (c) => {
  throw new Error("Ops!");
});

app
  // .route("/", index)
  // .route("/api/v1", checkout)
  .route("/api/v1", transaction);

export default app;

export type AppType = typeof app;
