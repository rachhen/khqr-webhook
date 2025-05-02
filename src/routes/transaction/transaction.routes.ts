import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { createErrorSchema, createValidationErrorSchema } from "~/schema/error";
import {
  TransactionBodySchema,
  TransactionDataSchema,
  TransactionParamsMd5,
} from "~/schema/transaction";

const tags = ["Transaction"];

export const createTransaction = createRoute({
  tags,
  method: "post",
  path: "/transaction",
  // middleware: [requiredApiKey] as const,
  security: [{ apiKey: [] }],
  description: "Create a new transaction",
  request: {
    body: jsonContentRequired(TransactionBodySchema, "The transaction body"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({ message: z.string(), status: z.string() }),
      "The transaction has been created"
    ),
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "The transaction already exists"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      createErrorSchema(HttpStatusCodes.UNAUTHORIZED),
      "Unauthorized"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createValidationErrorSchema(TransactionBodySchema),
      "The transaction body is invalid"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      createErrorSchema(HttpStatusCodes.INTERNAL_SERVER_ERROR),
      "Unknown error"
    ),
  },
});

export const getTransactionByMd5 = createRoute({
  tags,
  method: "get",
  path: "/transaction/{md5}",
  // middleware: [requiredApiKey] as const,
  security: [{ apiKey: [] }],
  description: "Get a transaction by md5",
  request: {
    params: TransactionParamsMd5,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      TransactionDataSchema,
      "Return the Khqr transaction data"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      createErrorSchema(HttpStatusCodes.NOT_FOUND),
      "The Khqr transaction not found"
    ),
    [HttpStatusCodes.EXPECTATION_FAILED]: jsonContent(
      createErrorSchema(HttpStatusCodes.EXPECTATION_FAILED),
      "The Khqr transaction return failed"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      createErrorSchema(HttpStatusCodes.INTERNAL_SERVER_ERROR),
      "Internal server error"
    ),
  },
});

export const trackTransaction = createRoute({
  tags,
  method: "get",
  path: "/transaction/{md5}/track",
  // middleware: [requiredApiKey] as const,
  security: [{ apiKey: [] }],
  description: "Track a transaction by md5",
  request: {
    params: TransactionParamsMd5,
  },
  responses: {
    [HttpStatusCodes.OK]: {
      description:
        "SSE for tracking transaction status, it will send back a status every 3 seconds.",
      content: {
        "text/plain": {
          schema: z.string().openapi({
            example: "PENDING | COMPLETED | FAILED",
            enum: ["PENDING", "COMPLETED", "FAILED"],
          }),
        },
      } as unknown as undefined,
    },
  },
});

export type CreateTransactionRoute = typeof createTransaction;
export type GetTransactionByMd5Route = typeof getTransactionByMd5;
export type TrackTransactionRoute = typeof trackTransaction;
