import * as z from "@zod/zod";

import { AdmLevelCode } from "@scope/consts/models";

export const getAdmEntitiesUnionPaginationCursorSchema = z.object({
  admLevel: z.enum(
    [
      AdmLevelCode.PROVINCE,
      AdmLevelCode.REGION,
      AdmLevelCode.DISTRICT,
      AdmLevelCode.COMMUNE,
      AdmLevelCode.FOKONTANY,
    ] as const,
  ),
  value: z.string(),
  id: z.union([z.string(), z.number()]).optional(),
});
