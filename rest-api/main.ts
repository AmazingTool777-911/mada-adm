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
import { entityIdSchema } from "./schemas/request.schemas.ts";
import { AppHTTPException } from "./errors/app-http-exception.error.ts";
import { parseLimitQueryParam } from "./helpers/pagination.helper.ts";

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
    const limit = c.req.query("limit");
    const cursor = c.req.query("cursor");
    const from = c.req.query("from");
    const search = c.req.query("search");
    const admEntityQueries = c.get("admEntityQueries");
    const paginatedAdmEntities = await admEntityQueries.getUnionCursorPaginated(
      {
        limit: parseLimitQueryParam(limit),
        cursorEncoded: cursor,
        encodeCursor: true,
      },
      {
        from: from as (AdmLevelCode | undefined),
        search: search,
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
  "/api/provinces/:id",
  zValidator("param", z.object({ id: entityIdSchema })),
  zValidator(
    "query",
    z.object({
      include_geojson: z.enum(["0", "1"]).optional(),
    }),
  ),
  injectQueriesMiddleware("provinceQueries"),
  async (c) => {
    const id = c.req.param("id");
    const includeGeoJSON = c.req.query("include_geojson");
    const excludeGeoJSON = !includeGeoJSON ||
      (!!includeGeoJSON && includeGeoJSON === "0");
    const provinceQueries = c.get("provinceQueries");
    const province = await provinceQueries.getById(id, {
      excludeGeoJSON,
    });
    if (!province) {
      throw new AppHTTPException(
        ResponseErrorCode.ProvinceNotFound,
        StatusCodes.NOT_FOUND,
        {
          message: "Province not found",
        },
      );
    }
    return c.json(province, StatusCodes.OK);
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

app.get(
  "/api/regions/:id",
  zValidator("param", z.object({ id: entityIdSchema })),
  zValidator(
    "query",
    z.object({
      include_geojson: z.enum(["0", "1"]).optional(),
    }),
  ),
  injectQueriesMiddleware("regionQueries"),
  async (c) => {
    const id = c.req.param("id");
    const includeGeoJSON = c.req.query("include_geojson");
    const excludeGeoJSON = !includeGeoJSON ||
      (!!includeGeoJSON && includeGeoJSON === "0");
    const regionQueries = c.get("regionQueries");
    const region = await regionQueries.getById(id, {
      excludeGeoJSON,
    });
    if (!region) {
      throw new AppHTTPException(
        ResponseErrorCode.RegionNotFound,
        StatusCodes.NOT_FOUND,
        {
          message: "Region not found",
        },
      );
    }
    return c.json(region, StatusCodes.OK);
  },
);

app.get(
  "/api/districts",
  zValidator(
    "query",
    z.object({
      limit: z.string().regex(/^\d+$/, "The limit must be a number").optional(),
      cursor: z.string().optional(),
      search: z.string().optional(),
      province_id: entityIdSchema.optional(),
      region_id: entityIdSchema.optional(),
    }),
  ),
  injectQueriesMiddleware("districtQueries"),
  async (c) => {
    const limit = c.req.query("limit");
    const cursor = c.req.query("cursor");
    const search = c.req.query("search");
    const provinceId = c.req.query("province_id");
    const regionId = c.req.query("region_id");
    const districtQueries = c.get("districtQueries");
    const paginatedDistricts = await districtQueries.getManyCursorPaginated(
      {
        limit: parseLimitQueryParam(limit),
        cursorEncoded: cursor,
        encodeCursor: true,
      },
      { search, provinceId, regionId },
    );
    return c.json(paginatedDistricts, StatusCodes.OK);
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

  if (err instanceof AppHTTPException) {
    return c.json<ApiErrorResponse>(
      {
        error: err.message,
        code: err.code,
        cause: err.cause,
      },
      err,
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
