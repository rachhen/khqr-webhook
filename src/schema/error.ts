import { z } from "@hono/zod-openapi";

export type ZodSchema =
  | z.ZodUnion<any>
  | z.AnyZodObject
  | z.ZodArray<z.AnyZodObject>;

export const createValidationErrorSchema = <T extends ZodSchema>(schema: T) => {
  const { error } = schema.safeParse(
    schema._def.typeName === z.ZodFirstPartyTypeKind.ZodArray ? [] : {}
  );

  return z.object({
    name: z.literal("VALIDATION_ERROR"),
    message: z.string(),
    details: z
      .record(z.any(), z.array(z.string()).optional())
      .optional()
      .openapi({
        example: error?.flatten().fieldErrors,
      }),
  });
};

export const createErrorSchema = (status = 422) => {
  const code = mapErrorStatus(status);

  return z.object({
    name: z.string().openapi({ example: code }),
    message: z.string(),
    details: z.unknown().optional().openapi({ example: "" }),
  });
};

export function mapErrorStatus(code: number) {
  switch (code) {
    case 400:
      return "BAD_REQUEST";
    case 417:
      return "EXPECTATION_FAILED";
    case 422:
      return "VALIDATION_ERROR";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 500:
      return "INTERNAL_SERVER_ERROR";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}
