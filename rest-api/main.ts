import { Hono } from "hono";
import { StatusCodes } from "http-status-codes";
import * as z from "@zod/zod";
import { zValidator } from "@hono/zod-validator";

import { connectDbMiddleware } from "./middlewares/connect-db.middleware.ts";
import { loadConfigMiddleware } from "./middlewares/load-config.middleware.ts";
import type { ApiErrorResponse, RestApiEnv } from "./rest-api.d.ts";
import { getDbConnection } from "./connect-db.ts";
import { injectQueriesMiddleware } from "./middlewares/inject-queries.middleware.ts";
import {
  ADM_LEVEL_CODES_INDEXED,
  ADM_LEVEL_TITLE_BY_CODE,
  AdmLevelCode,
} from "@scope/consts/models";
import { MadaAdmConfigConflictError } from "@scope/queries/helpers";
import { ResponseErrorCode } from "./consts/response-error-code.const.ts";

await getDbConnection();

const app = new Hono<RestApiEnv>();

app.use(connectDbMiddleware);
app.use(loadConfigMiddleware);

app.get("/", (c) => {
  return c.json({});
});

app.get(
  "/api/adm_entities/in_batch",
  injectQueriesMiddleware(
    "provinceQueries",
    "regionQueries",
    "districtQueries",
    "communeQueries",
    "fokontanyQueries",
  ),
  async (c) => {
    const provinceQueries = c.get("provinceQueries");
    const regionQueries = c.get("regionQueries");
    const districtQueries = c.get("districtQueries");
    const communeQueries = c.get("communeQueries");
    const fokontanyQueries = c.get("fokontanyQueries");
    const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 10;
    const data = await Promise.all([
      (async () => {
        const provinces = await provinceQueries.getAll();
        return {
          admLevel: {
            code: AdmLevelCode.PROVINCE,
            title: ADM_LEVEL_TITLE_BY_CODE.get(AdmLevelCode.PROVINCE)!,
          },
          provinces,
        };
      })(),
      (async () => {
        const regions = await regionQueries.getAll();
        return {
          admLevel: {
            code: AdmLevelCode.REGION,
            title: ADM_LEVEL_TITLE_BY_CODE.get(AdmLevelCode.REGION)!,
          },
          regions,
        };
      })(),
      (async () => {
        const paginatedDistricts = await districtQueries.getManyCursorPaginated(
          { limit, cursor: null, encodeCursor: true },
        );
        return {
          admLevel: {
            code: AdmLevelCode.DISTRICT,
            title: ADM_LEVEL_TITLE_BY_CODE.get(AdmLevelCode.DISTRICT)!,
          },
          paginatedDistricts,
        };
      })(),
      (async () => {
        const paginatedCommunes = await communeQueries.getManyCursorPaginated(
          { limit, cursor: null, encodeCursor: true },
        );
        return {
          admLevel: {
            code: AdmLevelCode.COMMUNE,
            title: ADM_LEVEL_TITLE_BY_CODE.get(AdmLevelCode.COMMUNE)!,
          },
          paginatedCommunes,
        };
      })(),
      (async () => {
        const paginatedFokontanys = await fokontanyQueries
          .getManyCursorPaginated(
            { limit, cursor: null, encodeCursor: true },
          );
        return {
          admLevel: {
            code: AdmLevelCode.FOKONTANY,
            title: ADM_LEVEL_TITLE_BY_CODE.get(AdmLevelCode.FOKONTANY)!,
          },
          paginatedFokontanys,
        };
      })(),
    ]);
    return c.json(data, StatusCodes.OK);
  },
);

app.get(
  "/api/adm_entities/in_union",
  zValidator(
    "query",
    z.object({
      limit: z.string().regex(/^\d+$/, "The limit must be a number").optional(),
      cursor: z.string().optional(),
      search: z.string().optional(),
      from: z.enum(ADM_LEVEL_CODES_INDEXED).optional(),
    }),
  ),
  injectQueriesMiddleware("admEntityQueries"),
  async (c) => {
    const limitQuery = c.req.query("limit");
    const cursorQuery = c.req.query("cursor");
    const fromQuery = c.req.query("from");
    const searchQuery = c.req.query("search");
    const admEntityQueries = c.get("admEntityQueries");
    const paginatedAdmEntities = await admEntityQueries.getUnionCursorPaginated(
      {
        limit: limitQuery ? Number(limitQuery) : 10,
        cursorEncoded: cursorQuery,
        encodeCursor: true,
      },
      {
        from: fromQuery as (AdmLevelCode | undefined),
        search: searchQuery,
      },
    );
    return c.json(paginatedAdmEntities, StatusCodes.OK);
  },
);

app.get(
  "/api/provinces",
  injectQueriesMiddleware("provinceQueries"),
  async (c) => {
    const provinceQueries = c.get("provinceQueries");
    const provinces = await provinceQueries.getAll();
    return c.json(provinces, StatusCodes.OK);
  },
);

app.get(
  "/api/regions",
  injectQueriesMiddleware("regionQueries"),
  async (c) => {
    const regionQueries = c.get("regionQueries");
    const regions = await regionQueries.getAll();
    return c.json(regions, StatusCodes.OK);
  },
);

app.onError((err, c) => {
  if (err instanceof z.ZodError) {
    return c.json<ApiErrorResponse>(
      {
        error: err.issues.map((issue) => issue.message).join(" || "),
        code: ResponseErrorCode.ValidationError,
        data: err.issues,
      },
      StatusCodes.UNPROCESSABLE_ENTITY,
    );
  }

  if (err instanceof MadaAdmConfigConflictError) {
    return c.json<ApiErrorResponse>(
      {
        error: err.message,
        code: ResponseErrorCode.MadaAdmConflict,
        data: err.data,
      },
      StatusCodes.BAD_REQUEST,
    );
  }

  return c.json<ApiErrorResponse>(
    {
      error: err.message || "An unexpected error occurred",
      code: ResponseErrorCode.UnexpectedError,
    },
    StatusCodes.INTERNAL_SERVER_ERROR,
  );
});

const port = Deno.env.has("REST_API_PORT")
  ? Number(Deno.env.get("REST_API_PORT")!)
  : 8000;
Deno.serve({ port }, app.fetch);
