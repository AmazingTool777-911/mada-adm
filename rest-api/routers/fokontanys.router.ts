import { Hono } from "@hono/hono";
import * as z from "@zod/zod";
import { zValidator } from "@hono/zod-validator";
import { StatusCodes } from "http-status-codes";

import type { RestApiEnv } from "../rest-api.d.ts";
import { entityIdSchema } from "../schemas/request.schemas.ts";
import { injectQueriesMiddleware } from "../middlewares/inject-queries.middleware.ts";
import { parseLimitQueryParam } from "../helpers/pagination.helper.ts";
import { AppHTTPException } from "../errors/app-http-exception.error.ts";
import { ResponseErrorCode } from "../consts/response-error-code.const.ts";
import type { District } from "@scope/types/models";
import { AdmLevelCode } from "@scope/consts/models";
import { ForeignKeysNotRepeatedError } from "@scope/queries/helpers";

export const fokontanysRouter = new Hono<RestApiEnv>()
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
        district_id: entityIdSchema.optional(),
        commune_id: entityIdSchema.optional(),
      }),
    ),
    injectQueriesMiddleware("fokontanyQueries"),
    async (c) => {
      const limit = c.req.query("limit");
      const cursor = c.req.query("cursor");
      const search = c.req.query("search");
      const provinceId = c.req.query("province_id");
      const regionId = c.req.query("region_id");
      const districtId = c.req.query("district_id");
      const communeId = c.req.query("commune_id");
      const fokontanyQueries = c.get("fokontanyQueries");
      const paginatedFokontanys = await fokontanyQueries.getManyCursorPaginated(
        {
          limit: parseLimitQueryParam(limit),
          cursorEncoded: cursor,
          encodeCursor: true,
        },
        { search, provinceId, regionId, districtId, communeId },
      );
      return c.json(paginatedFokontanys, StatusCodes.OK);
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
    injectQueriesMiddleware("fokontanyQueries"),
    async (c) => {
      const id = c.req.param("id");
      const includeGeoJSON = c.req.query("include_geojson");
      const excludeGeoJSON = !includeGeoJSON ||
        (!!includeGeoJSON && includeGeoJSON === "0");
      const fokontanyQueries = c.get("fokontanyQueries");
      const fokontany = await fokontanyQueries.getById(id, {
        excludeGeoJSON,
      });
      if (!fokontany) {
        throw new AppHTTPException(
          ResponseErrorCode.FokontanyNotFound,
          StatusCodes.NOT_FOUND,
          {
            message: "Fokontany not found",
          },
        );
      }
      return c.json(fokontany, StatusCodes.OK);
    },
  )
  .get(
    ":id/district",
    zValidator("param", z.object({ id: entityIdSchema })),
    zValidator(
      "query",
      z.object({
        include_geojson: z.enum(["0", "1"]).optional(),
        strategy: z.enum(["fk", "geojson"]).optional(),
      }),
    ),
    injectQueriesMiddleware("fokontanyQueries", "districtQueries"),
    async (c) => {
      const id = c.req.param("id");
      const includeGeoJSON = c.req.query("include_geojson");
      const excludeGeoJSON = !includeGeoJSON ||
        (!!includeGeoJSON && includeGeoJSON === "0");
      const fokontanyQueries = c.get("fokontanyQueries");
      const fokontany = await fokontanyQueries.getById(id, {
        excludeGeoJSON,
      });
      if (!fokontany) {
        throw new AppHTTPException(
          ResponseErrorCode.FokontanyNotFound,
          StatusCodes.NOT_FOUND,
          {
            message: "Fokontany not found",
          },
        );
      }
      const districtQueries = c.get("districtQueries");
      const strategy = c.req.query("strategy") ?? "fk";
      let district: District | null;
      if (strategy === "fk") {
        if (!fokontany.districtId) {
          throw new ForeignKeysNotRepeatedError(
            AdmLevelCode.FOKONTANY,
            AdmLevelCode.DISTRICT,
          );
        }
        district = await districtQueries.getById(fokontany.districtId, {
          excludeGeoJSON,
        });
      } else if (strategy === "geojson") {
        district = await districtQueries.getByFokontanyGeoJson(fokontany.id, {
          excludeGeoJSON,
        });
      } else {
        throw new AppHTTPException(
          ResponseErrorCode.InvalidQueryParam,
          StatusCodes.BAD_REQUEST,
          {
            message: `Unknown strategy "${strategy}" query param`,
          },
        );
      }
      if (!district) {
        throw new AppHTTPException(
          ResponseErrorCode.DistrictNotFound,
          StatusCodes.NOT_FOUND,
          { message: "District not found" },
        );
      }
      return c.json(district, StatusCodes.OK);
    },
  );
