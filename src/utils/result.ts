/**
 * Represents a Result type that can either hold a value of type T or an Error.
 * @example
 * // Successful result with a number
 * const successResult: Result<number> = ok(42);
 *
 * // Error result with a custom error message
 * const errorResult: Result<number> = err("Something went wrong");
 */
export type Result<T> = Ok<T> | Err;

/**
 * Represents a successful Result.
 * @example
 * // Successful result with a number
 * const successResult: Ok<number> = { value: 42, error: null };
 */
export type Ok<T> = { value: T; error: null };

/**
 * Represents an error Result.
 * @example
 * // Error result with a custom error message
 * const errorResult: Err<number> = { value: null, error: Error };
 */
export type Err = { value: null; error: Error };

/**
 * Creates a successful Result with the provided data.
 * @param data The value to be wrapped in a successful Result.
 * @returns A Result containing the provided data and null for the error.
 * @example
 * // Create a successful result with a string
 * const successResult: Result<string> = ok("Hello, World!");
 */
export const ok = <T>(data: T): Result<T> => ({ value: data, error: null });

/**
 * Creates an error Result with the provided error.
 * If the error is not an instance of Error, it is wrapped in an Error object.
 * @param error The error to be wrapped in an error Result.
 * @returns A Result containing null for the value and the provided or wrapped error.
 * @example
 * // Create an error result with a custom error message
 * const errorResult: Result<number> = err("Something went wrong");
 *
 * // Create an error result with an existing Error object
 * const errorResult2: Result<number> = err(new Error("Another error"));
 */

export const err = (error: any): Err =>
	error instanceof Error
		? { value: null, error }
		: { value: null, error: new Error(error, { cause: error }) };

/**
 * Checks if a Result is successful.
 * @param result The Result to be checked.
 * @returns True if the Result is successful, false otherwise.
 * @example
 * // Check if a result is successful
 * if (isOk(successResult)) {
 *   // Handle successful result
 *   console.log("Success:", successResult.value);
 * } else {
 *   // Handle error result
 *   console.error("Error:", successResult.error?.message);
 * }
 */
export const isOk = <T>(
	result: Result<T>,
): result is { value: T; error: null } => result.error === null;

/**
 * Checks if a Result is an error.
 * @param result The Result to be checked.
 * @returns True if the Result is an error, false otherwise.
 * @example
 * // Check if a result is an error
 * if (isErr(errorResult)) {
 *   // Handle error result
 *   console.error("Error:", errorResult.error?.message);
 * } else {
 *   // Handle successful result
 *   console.log("Success:", errorResult.value);
 * }
 */
export const isErr = <T>(
	result: Result<T>,
): result is { value: null; error: Error } => result.error !== null;
