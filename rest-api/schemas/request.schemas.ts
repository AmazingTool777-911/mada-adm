import z from "@zod/zod";

export const entityIdSchema = z.string().regex(
  /^([0-9a-fA-F]{24}|\d+)$/,
  "Resource id must be either an integer or a valid Mongo ObjectId hexadecimal",
);
