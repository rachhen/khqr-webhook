import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { requiredApiKey } from "~/middleware/auth";

import { createErrorSchema, createValidationErrorSchema } from "~/schema/error";
import {
  TransactionBodyEmailSchema,
  TransactionBodyTokenSchema,
  TransactionDataSchema,
  TransactionParamsMd5,
} from "~/schema/transaction";

const tags = ["Transaction"];

export const createTransactionToken = createRoute({
  tags,
  method: "post",
  path: "/transaction/token",
  security: [{ apiKey: [] }],
  middleware: [requiredApiKey] as const,
  description: "Create a new transaction by bakong token get from bakong",
  request: {
    body: jsonContentRequired(
      TransactionBodyTokenSchema,
      "The transaction body that get from bakong"
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({ message: z.string(), jobId: z.string() }),
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
      createValidationErrorSchema(TransactionBodyTokenSchema),
      "The transaction body is invalid"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      createErrorSchema(HttpStatusCodes.INTERNAL_SERVER_ERROR),
      "Unknown error"
    ),
  },
});

export const createTransactionEmail = createRoute({
  tags,
  method: "post",
  path: "/transaction/email",
  security: [{ apiKey: [] }],
  middleware: [requiredApiKey] as const,
  description: "Create a new transaction by bakong registered email",
  request: {
    body: jsonContentRequired(
      TransactionBodyEmailSchema,
      "The transaction body that registered on bakong"
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({ message: z.string(), jobId: z.string() }),
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
      createValidationErrorSchema(TransactionBodyEmailSchema),
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
  path: "/transaction/{md5}/md5",
  security: [{ apiKey: [] }],
  middleware: [requiredApiKey] as const,
  description: "Get a transaction by md5",
  request: {
    params: TransactionParamsMd5,
    query: z.object({
      token: z.string().optional().openapi({
        description:
          "The token that get from Bakong. Noted: The token maybe expired.",
      }),
      email: z.string().optional().openapi({
        description:
          "The email that registered from Bakong. Noted: The renew token api from Bakong is unstable and may not work.",
      }),
    }),
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
  path: "/transaction/{jobId}/track",
  security: [{ apiKey: [] }],
  middleware: [requiredApiKey] as const,
  description: "Track a transaction by id",
  request: {
    params: z.object({ jobId: z.string() }),
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

export type CreateTransactionTokenRoute = typeof createTransactionToken;
export type CreateTransactionEmailRoute = typeof createTransactionEmail;
export type GetTransactionByMd5Route = typeof getTransactionByMd5;
export type TrackTransactionRoute = typeof trackTransaction;
