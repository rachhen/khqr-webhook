import md5 from "md5";

import { redis } from "~/lib/redis";
import type {
	KhqrNewTokenResponse,
	KhqrTransactionResponse,
} from "../types/khqr";
import { decodeBakongToken } from "./jwt";
import { err, ok } from "./result";

export const BAKONG_API_URL = "https://api-bakong.nbc.gov.kh";

/**
 * Get transaction by md5 from Bakong API
 * @param token - Bakong token
 * @param md5 - md5 of the transaction
 * @param bakongBaseUrl - Bakong base url (default: https://api-bakong.nbc.gov.kh) the custom url can be used for testing purpose
 * @returns
 */
export const getTransactionByMd5 = async (
	token: string,
	md5: string,
	bakongBaseUrl = BAKONG_API_URL,
) => {
	// Random return success for testing purpose
	// if (process.env.NODE_ENV === "development" && Math.random() > 0.5) {
	// 	return ok({
	// 		responseCode: 0,
	// 		responseMessage: "Getting transaction successfully.",
	// 		errorCode: null,
	// 		data: {
	// 			hash: md5,
	// 			fromAccountId: "1234567890",
	// 			toAccountId: "0987654321",
	// 			currency: "KHR",
	// 			amount: 1000,
	// 			description: "Test transaction",
	// 			createdDateMs: Date.now(),
	// 			acknowledgedDateMs: Date.now(),
	// 		},
	// 	} satisfies KhqrTransactionResponse);
	// }

	const res = await fetch(`${bakongBaseUrl}/v1/check_transaction_by_md5`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ md5 }),
	});

	if (!res.ok) {
		return err("Failed to fetch transaction by md5");
	}

	const data = await res.json();

	return ok(data as KhqrTransactionResponse);
};

/**
 * Generate new token from Bakong API
 * @param email - Email that registered from Bakong
 * @param bakongBaseUrl - Bakong base url (default: https://api-bakong.nbc.gov.kh) the custom url can be used for testing purpose
 * @returns
 */
export const generateNewToken = async (
	email: string,
	bakongBaseUrl = BAKONG_API_URL,
) => {
	const res = await fetch(`${bakongBaseUrl}/v1/renew_token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ email }),
	});

	if (!res.ok) {
		return err("Failed to generate new token");
	}

	const data = (await res.json()) as KhqrNewTokenResponse;

	if (data.responseCode === 1) {
		return err(data.responseMessage);
	}

	const decoded = decodeBakongToken(data.data.token);

	return ok({ token: data.data.token, expiredAt: decoded.expiredAt });
};

/**
 * Get Bakong token by email. If the token is not found, it will generate a new token and save it to Redis.
 * If the token is expired, it will generate a new token and save it to Redis.
 *
 * @param registeredEmail - Email that registered from Bakong
 * @returns Bakong token
 */
export const getBakongTokenByEmail = async (registeredEmail: string) => {
	const key = md5(registeredEmail);

	const existsToken = await redis.get(key);
	if (existsToken) {
		return existsToken;
	}

	const token = await generateNewToken(registeredEmail);
	if (token.error) {
		throw token.error;
	}

	const expiredAt = token.value.expiredAt.getTime() / 1000;
	await redis.set(key, token.value.token, "EX", expiredAt);

	return token.value.token;
};
