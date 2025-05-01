import { z } from "@hono/zod-openapi";

export const TransactionParamsMd5 = z.object({ md5: z.string() });

export const TransactionDataSchema = z.object({
  hash: z.string(),
  fromAccountId: z.string(),
  toAccountId: z.string(),
  currency: z.string(),
  amount: z.number(),
  description: z.string(),
  createdDateMs: z.number(),
  acknowledgedDateMs: z.number(),
});

export const TransactionBodySchema = z.object({
  md5: z.string(),
  webhookUrl: z.string().url(),
});
