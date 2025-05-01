import { Scalar } from "@scalar/hono-api-reference";

import type { AppHono } from "~/types";

import packageJSON from "../../package.json";

export function registerOpenAPI(app: AppHono) {
  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: packageJSON.version,
      title: "KHQR Webhook API",
    },
  });

  app.get(
    "/reference",
    Scalar({
      theme: "kepler",
      layout: "modern",
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "fetch",
      },
      authentication: {
        securitySchemes: {
          apiKey: {
            type: "http",
            scheme: "bearer",
          },
        },
      },
      url: "/doc",
    })
  );
}
