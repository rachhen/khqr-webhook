import { streamSSE } from "hono/streaming";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "~/types";

import { apiError } from "~/utils/error";
import { getBakongTokenByEmail, getTransactionByMd5 } from "~/utils/khqr";
import type {
  CreateTransactionEmailRoute,
  CreateTransactionTokenRoute,
  GetTransactionByMd5Route,
  TrackTransactionRoute,
} from "./transaction.routes";
import { transactionQueue } from "~/queues/transaction";
import { isBakongTokenExpired } from "~/utils/jwt";

export const createTransactionToken: AppRouteHandler<
  CreateTransactionTokenRoute
> = async (c) => {
  const body = c.req.valid("json");

  if (isBakongTokenExpired(body.token)) {
    throw apiError({
      name: "UNAUTHORIZED",
      message: "Token is expired",
      statusCode: HttpStatusCodes.UNAUTHORIZED,
    });
  }

  const jobId = crypto.randomUUID();
  await transactionQueue.add({
    jobId,
    token: body.token,
    md5: body.md5,
    webhookUrl: body.webhookUrl,
  });

  return c.json(
    { message: "Transaction created", jobId },
    HttpStatusCodes.CREATED
  );
};

export const createTransactionEmail: AppRouteHandler<
  CreateTransactionEmailRoute
> = async (c) => {
  const body = c.req.valid("json");

  const token = await getBakongTokenByEmail(body.email);

  const jobId = crypto.randomUUID();
  await transactionQueue.add({
    token,
    jobId,
    md5: body.md5,
    webhookUrl: body.webhookUrl,
  });

  return c.json(
    { message: "Transaction created", jobId },
    HttpStatusCodes.CREATED
  );
};

export const getTransactionByMd5Handler: AppRouteHandler<
  GetTransactionByMd5Route
> = async (c) => {
  const md5 = c.req.param("md5");
  const qtoken = c.req.query("token");
  const email = c.req.query("email");

  let token: string | undefined;
  if (qtoken) {
    token = qtoken;
  } else if (email) {
    token = await getBakongTokenByEmail(email);
  }

  if (!token) {
    throw apiError({
      name: "BAD_REQUEST",
      message: "Token or email is required",
      statusCode: HttpStatusCodes.BAD_REQUEST,
    });
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
  const jobId = c.req.param("jobId");

  return streamSSE(
    c,
    async (stream) => {
      stream.onAbort(async () => {
        stream.abort();
        await stream.close();
      });

      while (true) {
        const job = await transactionQueue.queue.getJob(jobId);
        const isCompleted = (await job?.isCompleted()) ?? false;
        const isFailed = (await job?.isFailed()) ?? false;

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
