import z from "@zod/zod";

export const requestIdParamSchema = z.string().regex(
  /^([0-9a-fA-F]{24}|\d+)$/,
  "Request id parameter must be either an integer or a valid Mongo ObjectId hexadecimal",
);
