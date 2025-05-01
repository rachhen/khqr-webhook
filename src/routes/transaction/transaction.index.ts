import { createRouter } from "~/lib/create-app";

import * as handlers from "./transaction.handlers";
import * as routes from "./transaction.routes";

const transaction = createRouter()
  .openapi(routes.createTransaction, handlers.createTransactionHandler)
  .openapi(routes.getTransactionByMd5, handlers.getTransactionByMd5Handler)
  .openapi(routes.trackTransaction, handlers.trackTransaction);

export default transaction;
