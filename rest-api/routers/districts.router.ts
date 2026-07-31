import { Hono } from "@hono/hono";
import * as z from "@zod/zod";
import { zValidator } from "@hono/zod-validator";
import { StatusCodes } from "http-status-codes";

import type { RestApiEnv } from "../rest-api.d.ts";
import { entityIdSchema } from "../schemas/request.schemas.ts";
import { injectQueriesMiddleware } from "../middlewares/inject-queries.middleware.ts";
import { parseLimitQueryParam } from "../helpers/pagination.helper.ts";
import { ResponseErrorCode } from "../consts/response-error-code.const.ts";
import { AppHTTPException } from "../errors/app-http-exception.error.ts";

export const districtsRouter = new Hono<RestApiEnv>()
  .get(
    "",
    zValidator(
      "query",
      z.object({
        limit: z.string().regex(/^\d+$/, "The limit must be a number")
          .optional(),
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
  )
  .get(
    ":id",
    zValidator("param", z.object({ id: entityIdSchema })),
    zValidator(
      "query",
      z.object({
        include_geojson: z.enum(["0", "1"]).optional(),
      }),
    ),
    injectQueriesMiddleware("districtQueries"),
    async (c) => {
      const id = c.req.param("id");
      const includeGeoJSON = c.req.query("include_geojson");
      const excludeGeoJSON = !includeGeoJSON ||
        (!!includeGeoJSON && includeGeoJSON === "0");
      const districtQueries = c.get("districtQueries");
      const district = await districtQueries.getById(id, {
        excludeGeoJSON,
      });
      if (!district) {
        throw new AppHTTPException(
          ResponseErrorCode.DistrictNotFound,
          StatusCodes.NOT_FOUND,
          {
            message: "District not found",
          },
        );
      }
      return c.json(district, StatusCodes.OK);
    },
  );
