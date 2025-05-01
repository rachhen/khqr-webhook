export interface KhqrTransactionSuccess {
  responseCode: 0;
  responseMessage: "Getting transaction successfully.";
  errorCode: null;
  data: {
    hash: string;
    fromAccountId: string;
    toAccountId: string;
    currency: string;
    amount: number;
    description: string;
    createdDateMs: number;
    acknowledgedDateMs: number;
  };
}

export interface KhqrTransactionFailed {
  responseCode: 1;
  responseMessage: "Transaction failed.";
  errorCode: 3;
  data: null;
}

export interface KhqrTransactionNotFound {
  responseCode: 1;
  responseMessage: "Transaction could not be found. Please check and try again.";
  errorCode: 1;
  data: null;
}

export type KhqrTransactionResponse =
  | KhqrTransactionSuccess
  | KhqrTransactionFailed
  | KhqrTransactionNotFound;

export interface KhqrNewTokenSuccess {
  responseCode: 0;
  responseMessage: "Token has been issued";
  errorCode: null;
  data: {
    token: string;
  };
}

export interface KhqrNewTokenFailed {
  responseCode: 1;
  responseMessage: "Not registered yet";
  errorCode: 10;
  data: null;
}

export type KhqrNewTokenResponse = KhqrNewTokenSuccess | KhqrNewTokenFailed;
