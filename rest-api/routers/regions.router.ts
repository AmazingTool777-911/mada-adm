import { Hono } from "@hono/hono";
import { StatusCodes } from "http-status-codes";
import * as z from "@zod/zod";
import { zValidator } from "@hono/zod-validator";

import type { RestApiEnv } from "../rest-api.d.ts";
import { injectQueriesMiddleware } from "../middlewares/inject-queries.middleware.ts";
import { entityIdSchema } from "../schemas/request.schemas.ts";
import { AppHTTPException } from "../errors/app-http-exception.error.ts";
import { ResponseErrorCode } from "../consts/response-error-code.const.ts";

export const regionsRouter = new Hono<RestApiEnv>()
  .get(
    "",
    injectQueriesMiddleware("regionQueries"),
    async (c) => {
      const regionQueries = c.get("regionQueries");
      const regions = await regionQueries.getAll();
      return c.json(regions, StatusCodes.OK);
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
