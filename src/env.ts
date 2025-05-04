import { z } from "zod";

export const envSchema = z.object({
	NODE_ENV: z.union([
		z.literal("development"),
		z.literal("production"),
		z.literal("test"),
		z.literal("stage"),
	]),

	PORT: z.coerce.number().default(3000),

	REDIS_URL: z.string(),

	API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
