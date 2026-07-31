import * as z from "@zod/zod";

export const getManyDistrictPaginationCursorSchema = z.object({
  id: z.union([z.string(), z.number()]),
  district: z.string(),
});
