import { jwtDecode } from "jwt-decode";

import type {
  KhqrNewTokenResponse,
  KhqrTransactionResponse,
} from "../types/khqr";
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
  bakongBaseUrl = BAKONG_API_URL
) => {
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

  const data = await res.json<KhqrTransactionResponse>();

  return ok(data);
};

interface JwtPayload {
  data: { id: string };
  exp: number;
  iat: number;
}

export const generateNewToken = async (
  email: string,
  bakongBaseUrl = BAKONG_API_URL
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

  const data = await res.json<KhqrNewTokenResponse>();

  if (data.responseCode === 1) {
    return err(data.responseMessage);
  }

  const decoded = jwtDecode<JwtPayload>(data.data.token);
  const expiredAt = new Date(decoded.exp * 1000);

  return ok({ token: data.data.token, expiredAt });
};
