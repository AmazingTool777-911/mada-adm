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

export const communesRouter = new Hono<RestApiEnv>()
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
      }),
    ),
    injectQueriesMiddleware("communeQueries"),
    async (c) => {
      const limit = c.req.query("limit");
      const cursor = c.req.query("cursor");
      const search = c.req.query("search");
      const provinceId = c.req.query("province_id");
      const regionId = c.req.query("region_id");
      const districtId = c.req.query("district_id");
      const communeQueries = c.get("communeQueries");
      const paginatedCommunes = await communeQueries.getManyCursorPaginated(
        {
          limit: parseLimitQueryParam(limit),
          cursorEncoded: cursor,
          encodeCursor: true,
        },
        { search, provinceId, regionId, districtId },
      );
      return c.json(paginatedCommunes, StatusCodes.OK);
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
    injectQueriesMiddleware("communeQueries"),
    async (c) => {
      const id = c.req.param("id");
      const includeGeoJSON = c.req.query("include_geojson");
      const excludeGeoJSON = !includeGeoJSON ||
        (!!includeGeoJSON && includeGeoJSON === "0");
      const communeQueries = c.get("communeQueries");
      const commune = await communeQueries.getById(id, {
        excludeGeoJSON,
      });
      if (!commune) {
        throw new AppHTTPException(
          ResponseErrorCode.CommuneNotFound,
          StatusCodes.NOT_FOUND,
          {
            message: "Commune not found",
          },
        );
      }
      return c.json(commune, StatusCodes.OK);
    },
  );
