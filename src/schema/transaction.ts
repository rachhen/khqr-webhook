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

const baseTransactionBodySchema = z.object({
	md5: z.string().openapi({ description: "The md5 of the transaction" }),
	webhookUrl: z.string().url(),
});

export const TransactionBodyEmailSchema = baseTransactionBodySchema.extend({
	email: z
		.string()
		.email()
		.openapi({ description: "The Email that registered from Bakong" }),
});

export const TransactionBodyTokenSchema = baseTransactionBodySchema.extend({
	token: z.string().openapi({
		description: "The token get from Bakong. The token maybe expired",
	}),
});
