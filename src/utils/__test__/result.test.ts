import { describe, expect, it } from "vitest";

import { ok, err, isErr, isOk, type Result } from "../result";

describe("Result Type and Utility Functions", () => {
  it("should create a successful Result with the provided data", () => {
    const successResult: Result<number> = ok(42);
    expect(successResult.value).toBe(42);
    expect(successResult.error).toBe(null);
  });

  it("should create an error Result with the provided error", () => {
    const errorResult: Result<number> = err("Something went wrong");
    expect(errorResult.value).toBe(null);
    expect(errorResult.error instanceof Error).toBe(true);
    expect(errorResult.error?.message).toBe("Something went wrong");
  });

  it("should return the error if it is an instance of Error", () => {
    class CustomError extends Error {
      public code: number;
      constructor(message: string, code: number) {
        super(message);
        this.code = code;
      }
    }

    const customError = new CustomError("Something went wrong", 500);
    const errorResult: Result<number> = err(customError);
    expect(errorResult.value).toBe(null);
    expect(errorResult.error).toBe(customError);
  });

  it("should check if a Result is successful", () => {
    const successResult: Result<number> = ok(42);
    expect(isOk(successResult)).toBe(true);

    const errorResult: Result<number> = err("Error");
    expect(isOk(errorResult)).toBe(false);
  });

  it("should check if a Result is an error", () => {
    const successResult: Result<number> = ok(42);
    expect(isErr(successResult)).toBe(false);

    const errorResult: Result<number> = err("Error");
    expect(isErr(errorResult)).toBe(true);
  });
});
