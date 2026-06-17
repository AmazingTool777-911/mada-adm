import { Hono } from "@hono/hono";
import { StatusCodes } from "http-status-codes";
import * as z from "@zod/zod";
import { zValidator } from "@hono/zod-validator";

import type { RestApiEnv } from "../rest-api.d.ts";
import { injectQueriesMiddleware } from "../middlewares/inject-queries.middleware.ts";
import { entityIdSchema } from "../schemas/request.schemas.ts";
import { ResponseErrorCode } from "../consts/response-error-code.const.ts";
import { AppHTTPException } from "../errors/app-http-exception.error.ts";

export const provincesRouter = new Hono<RestApiEnv>()
  .get(
    "",
    injectQueriesMiddleware("provinceQueries"),
    async (c) => {
      const provinceQueries = c.get("provinceQueries");
      const provinces = await provinceQueries.getAll();
      return c.json(provinces, StatusCodes.OK);
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
