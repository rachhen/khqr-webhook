import * as HttpStatusCodes from "stoker/http-status-codes";
import { streamSSE } from "hono/streaming";

import type { AppRouteHandler } from "~/types";

import type {
  CreateTransactionRoute,
  GetTransactionByMd5Route,
  TrackTransactionRoute,
} from "./transaction.routes";
import { generateNewToken, getTransactionByMd5 } from "~/utils/khqr";
import { getKhqrToken, setKhqrToken } from "~/utils/cache";
import { apiError } from "~/utils/error";

export const createTransactionHandler: AppRouteHandler<
  CreateTransactionRoute
> = async (c) => {
  const body = c.req.valid("json");

  try {
    const instance = await c.env.TRX_WORKFLOW.get(body.md5);
    if (instance.id) {
      return c.json(
        { message: "The transaction already exists" },
        HttpStatusCodes.OK
      );
    }
  } catch (error) {}

  const instance = await c.env.TRX_WORKFLOW.create({
    id: body.md5,
    params: body,
  });

  const status = await instance.status();

  return c.json(
    { message: "Transaction created", status: status.status },
    HttpStatusCodes.CREATED
  );
};

export const getTransactionByMd5Handler: AppRouteHandler<
  GetTransactionByMd5Route
> = async (c) => {
  const md5 = c.req.param("md5");

  let token = await getKhqrToken(c.env);
  if (!token) {
    const khqrToken = await generateNewToken(c.env.BAKONG_REGISTERED_EMAIL);
    if (khqrToken.error) {
      throw apiError({
        name: "INTERNAL_SERVER_ERROR",
        message: khqrToken.error.message,
        statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      });
    }

    c.executionCtx.waitUntil(setKhqrToken(c.env, khqrToken.value));
    token = khqrToken.value.token;
  }

  const result = await getTransactionByMd5(token, md5);

  if (result.error) {
    throw apiError({
      name: "INTERNAL_SERVER_ERROR",
      message: result.error.message,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
    });
  }

  if (result.value.responseCode === 1) {
    if (result.value.errorCode === 3) {
      throw apiError({
        name: "EXPECTATION_FAILED",
        code: result.value.errorCode,
        message: result.value.responseMessage,
        statusCode: HttpStatusCodes.EXPECTATION_FAILED,
      });
    }

    throw apiError({
      name: "NOT_FOUND",
      code: result.value.errorCode,
      message: result.value.responseMessage,
      statusCode: HttpStatusCodes.NOT_FOUND,
    });
  }

  return c.json(result.value.data, HttpStatusCodes.OK);
};

export const trackTransaction: AppRouteHandler<TrackTransactionRoute> = async (
  c
) => {
  const md5 = c.req.param("md5");

  return streamSSE(
    c,
    async (stream) => {
      stream.onAbort(async () => {
        stream.abort();
        await stream.close();
      });

      while (true) {
        const instance = await c.env.TRX_WORKFLOW.get(md5);
        const instanceStatus = await instance.status();

        console.log(instanceStatus);

        const isCompleted = instanceStatus.status === "complete" || false;
        const isFailed =
          instanceStatus.status === "errored" ||
          instanceStatus.status === "terminated" ||
          false;

        if (isCompleted) {
          await stream.writeSSE({ data: "COMPLETED" });
          await stream.close();
        } else if (isFailed) {
          await stream.writeSSE({ data: "FAILED" });
          await stream.close();
        }

        await stream.writeSSE({ data: "PENDING" });
        await stream.sleep(3000);
      }
    },
    async (error, stream) => {
      await stream.writeln(`ERROR: ${error.message}`);
    }
  );
};
