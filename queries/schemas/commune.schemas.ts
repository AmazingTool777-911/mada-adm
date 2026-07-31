import z from "@zod/zod";

export const getManyCommunesCursorPaginatedSchema = z.object({
  id: z.union([z.string(), z.number()]),
  commune: z.string(),
});
