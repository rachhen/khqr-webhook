import { beforeEach, describe, expect, it, vi } from "vitest";

import { redis } from "~/lib/redis";
import type {
	KhqrNewTokenFailed,
	KhqrNewTokenSuccess,
	KhqrTransactionFailed,
	KhqrTransactionNotFound,
	KhqrTransactionSuccess,
} from "~/types/khqr";
import {
	BAKONG_API_URL,
	generateNewToken,
	getBakongTokenByEmail,
	getTransactionByMd5,
} from "../khqr";
import { err } from "../result";

// Add Redis mock
vi.mock("~/lib/redis", () => ({
	redis: {
		get: vi.fn(),
		set: vi.fn(),
	},
}));

vi.mock("~/utils/jwt", () => ({
	decodeBakongToken: vi.fn().mockReturnValue({
		id: "test-id",
		expiredAt: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7),
	}),
}));

describe("KHQR", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn() as unknown as typeof fetch;
	});

	describe("getTransactionByMd5", () => {
		const mockToken = "test-token";
		const mockMd5 = "test-md5";
		const mockResponseSuccess: KhqrTransactionSuccess = {
			responseCode: 0,
			responseMessage: "Getting transaction successfully.",
			errorCode: null,
			data: {
				hash: "test-hash",
				fromAccountId: "test-fromAccountId",
				toAccountId: "test-toAccountId",
				currency: "USD",
				amount: 100,
				description: "test-description",
				createdDateMs: 1629384000000,
				acknowledgedDateMs: 1629384000000,
			},
		};
		const mockResponseFailed: KhqrTransactionFailed = {
			responseCode: 1,
			responseMessage: "Transaction failed.",
			errorCode: 3,
			data: null,
		};
		const mockResponseNotFound: KhqrTransactionNotFound = {
			responseCode: 1,
			responseMessage:
				"Transaction could not be found. Please check and try again.",
			errorCode: 1,
			data: null,
		};

		it("should successfully response transaction by md5", async () => {
			const mockFetch = vi.fn().mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponseSuccess),
			});
			global.fetch = mockFetch as unknown as typeof fetch;

			const result = await getTransactionByMd5(mockToken, mockMd5);

			expect(global.fetch).toHaveBeenCalledWith(
				`${BAKONG_API_URL}/v1/check_transaction_by_md5`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${mockToken}`,
					},
					body: JSON.stringify({ md5: mockMd5 }),
				},
			);

			expect(result.value).toEqual(mockResponseSuccess);
			expect(result.error).toBeNull();
		});

		it("should return error when transaction failed", async () => {
			const mockFetch = vi.fn().mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponseFailed),
			});
			global.fetch = mockFetch as unknown as typeof fetch;

			const result = await getTransactionByMd5(mockToken, mockMd5);

			expect(result.error).toBeNull();
			expect(result.value).toEqual(mockResponseFailed);
		});

		it("should return not found when it can't find transaction", async () => {
			const mockFetch = vi.fn().mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponseNotFound),
			});
			global.fetch = mockFetch as unknown as typeof fetch;

			const result = await getTransactionByMd5(mockToken, mockMd5);

			expect(result.error).toBeNull();
			expect(result.value).toEqual(mockResponseNotFound);
		});

		it("should return error when fetch fails", async () => {
			const mockFetch = vi.fn().mockResolvedValueOnce({
				ok: false,
			});
			global.fetch = mockFetch as unknown as typeof fetch;

			const result = await getTransactionByMd5(mockToken, mockMd5);

			expect(result).toEqual(err("Failed to fetch transaction by md5"));
		});
	});

	describe("generateNewToken", () => {
		const mockEmail = "test@example.com";
		const mockToken =
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoidGVzdC1pZCJ9LCJleHAiOjE3MDg2MDg5NDcsImlhdCI6MTcwODYwNTM0N30.test";
		const mockResponseSuccess: KhqrNewTokenSuccess = {
			responseCode: 0,
			responseMessage: "Token has been issued",
			errorCode: null,
			data: {
				token: mockToken,
			},
		};
		const mockResponseFailed: KhqrNewTokenFailed = {
			responseCode: 1,
			responseMessage: "Not registered yet",
			errorCode: 10,
			data: null,
		};

		it("should successfully generate new token", async () => {
			const mockFetch = vi.fn().mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponseSuccess),
			});
			global.fetch = mockFetch as unknown as typeof fetch;

			const result = await generateNewToken(mockEmail);

			expect(global.fetch).toHaveBeenCalledWith(
				`${BAKONG_API_URL}/v1/renew_token`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ email: mockEmail }),
				},
			);

			expect(result.error).toBeNull();
			expect(result.value).toEqual({
				token: mockToken,
				expiredAt: expect.any(Date),
			});
		});

		it("should return error when user is not registered", async () => {
			const mockFetch = vi.fn().mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponseFailed),
			});
			global.fetch = mockFetch as unknown as typeof fetch;

			const result = await generateNewToken(mockEmail);

			expect(result).toEqual(err("Not registered yet"));
		});

		it("should throw error when fetch fails", async () => {
			const mockFetch = vi.fn().mockResolvedValueOnce({
				ok: false,
			});
			global.fetch = mockFetch as unknown as typeof fetch;

			const result = await generateNewToken(mockEmail);

			expect(result).toEqual(err("Failed to generate new token"));
		});

		it("should use custom bakong base url when provided", async () => {
			const customUrl = "https://custom-api.example.com";
			const mockFetch = vi.fn().mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponseSuccess),
			});
			global.fetch = mockFetch as unknown as typeof fetch;

			await generateNewToken(mockEmail, customUrl);

			expect(global.fetch).toHaveBeenCalledWith(
				`${customUrl}/v1/renew_token`,
				expect.any(Object),
			);
		});
	});

	describe("getBakongTokenByEmail", () => {
		const mockEmail = "test@example.com";
		const mockToken = "test-token";
		const mockMd5Hash = "test-md5-hash";
		const mockResponseSuccess: KhqrNewTokenSuccess = {
			responseCode: 0,
			responseMessage: "Token has been issued",
			errorCode: null,
			data: {
				token: mockToken,
			},
		};
		const mockResponseFailed: KhqrNewTokenFailed = {
			responseCode: 1,
			responseMessage: "Not registered yet",
			errorCode: 10,
			data: null,
		};

		it("should return existing token from Redis if available", async () => {
			vi.mock("md5", () => ({ default: () => "test-md5-hash" }));
			vi.mocked(redis.get).mockResolvedValueOnce(mockToken);

			const result = await getBakongTokenByEmail(mockEmail);

			expect(redis.get).toHaveBeenCalledWith(mockMd5Hash);
			expect(result).toBe(mockToken);
		});

		it("should generate new token and save to Redis if no token exists", async () => {
			vi.mock("md5", () => ({ default: () => "test-md5-hash" }));
			vi.mocked(redis.get).mockResolvedValueOnce(null);
			const mockFetch = vi.fn().mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponseSuccess),
			});
			global.fetch = mockFetch as unknown as typeof fetch;

			const result = await getBakongTokenByEmail(mockEmail);

			expect(redis.get).toHaveBeenCalledWith(mockMd5Hash);
			expect(redis.set).toHaveBeenCalledWith(
				mockMd5Hash,
				mockToken,
				"EX",
				expect.any(Number),
			);
			expect(result).toBe(mockToken);
		});

		it("should throw error when token generation fails", async () => {
			vi.mock("md5", () => ({ default: () => "test-md5-hash" }));
			vi.mocked(redis.get).mockResolvedValueOnce(null);
			const mockFetch = vi.fn().mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponseFailed),
			});
			global.fetch = mockFetch as unknown as typeof fetch;

			await expect(getBakongTokenByEmail(mockEmail)).rejects.toThrow(
				"Not registered yet",
			);
		});
	});
});
