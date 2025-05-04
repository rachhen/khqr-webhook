import { createRouter } from "~/lib/create-app";

import * as handlers from "./transaction.handlers";
import * as routes from "./transaction.routes";

const transaction = createRouter()
  .openapi(routes.createTransactionToken, handlers.createTransactionToken)
  .openapi(routes.createTransactionEmail, handlers.createTransactionToken)
  .openapi(routes.getTransactionByMd5, handlers.getTransactionByMd5Handler)
  .openapi(routes.trackTransaction, handlers.trackTransaction);

export default transaction;
