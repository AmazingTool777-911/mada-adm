import * as z from "@zod/zod";

export const getManyFokontanysPaginationCursorSchema = z.object({
  id: z.union([z.string(), z.number()]),
  fokontany: z.string(),
});
