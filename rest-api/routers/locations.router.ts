import { Hono } from "@hono/hono";
import * as z from "@zod/zod";
import { zValidator } from "@hono/zod-validator";
import { StatusCodes } from "http-status-codes";

import type { PointCoordinates } from "@scope/queries/types";
import type { RestApiEnv } from "../rest-api.d.ts";
import { injectQueriesMiddleware } from "../middlewares/inject-queries.middleware.ts";
import { AppHTTPException } from "../errors/app-http-exception.error.ts";
import { ResponseErrorCode } from "../consts/response-error-code.const.ts";

export const locationsRouter = new Hono<RestApiEnv>()
  .get(
    ":lat/:lng/district",
    zValidator(
      "param",
      z.object({ lat: z.coerce.number(), lng: z.coerce.number() }),
    ),
    zValidator(
      "query",
      z.object({
        include_geojson: z.enum(["0", "1"]).optional(),
      }),
    ),
    injectQueriesMiddleware("districtQueries"),
    async (c) => {
      const coordinates = [
        parseFloat(c.req.param("lng")),
        parseFloat(c.req.param("lat")),
      ] as PointCoordinates;
      const includeGeoJSON = c.req.query("include_geojson");
      const excludeGeoJSON = !includeGeoJSON ||
        (!!includeGeoJSON && includeGeoJSON === "0");
      const districtQueries = c.get("districtQueries");
      const district = await districtQueries.getByPointCoordinates(
        coordinates,
        { excludeGeoJSON },
      );
      if (!district) {
        throw new AppHTTPException(
          ResponseErrorCode.DistrictNotFound,
          StatusCodes.NOT_FOUND,
          { message: "District not found at the location coordinates" },
        );
      }
      return c.json(district, StatusCodes.OK);
    },
  )
  .get(
    ":lat/:lng/commune",
    zValidator(
      "param",
      z.object({ lat: z.coerce.number(), lng: z.coerce.number() }),
    ),
    zValidator(
      "query",
      z.object({
        include_geojson: z.enum(["0", "1"]).optional(),
      }),
    ),
    injectQueriesMiddleware("communeQueries"),
    async (c) => {
      const coordinates = [
        parseFloat(c.req.param("lng")),
        parseFloat(c.req.param("lat")),
      ] as PointCoordinates;
      const includeGeoJSON = c.req.query("include_geojson");
      const excludeGeoJSON = !includeGeoJSON ||
        (!!includeGeoJSON && includeGeoJSON === "0");
      const communeQueries = c.get("communeQueries");
      const commune = await communeQueries.getByPointCoordinates(
        coordinates,
        { excludeGeoJSON },
      );
      if (!commune) {
        throw new AppHTTPException(
          ResponseErrorCode.CommuneNotFound,
          StatusCodes.NOT_FOUND,
          { message: "Commune not found at the location coordinates" },
        );
      }
      return c.json(commune, StatusCodes.OK);
    },
  )
  .get(
    ":lat/:lng/fokontany",
    zValidator(
      "param",
      z.object({ lat: z.coerce.number(), lng: z.coerce.number() }),
    ),
    zValidator(
      "query",
      z.object({
        include_geojson: z.enum(["0", "1"]).optional(),
      }),
    ),
    injectQueriesMiddleware("fokontanyQueries"),
    async (c) => {
      const coordinates = [
        parseFloat(c.req.param("lng")),
        parseFloat(c.req.param("lat")),
      ] as PointCoordinates;
      const includeGeoJSON = c.req.query("include_geojson");
      const excludeGeoJSON = !includeGeoJSON ||
        (!!includeGeoJSON && includeGeoJSON === "0");
      const fokontanyQueries = c.get("fokontanyQueries");
      const fokontany = await fokontanyQueries.getByPointCoordinates(
        coordinates,
        { excludeGeoJSON },
      );
      if (!fokontany) {
        throw new AppHTTPException(
          ResponseErrorCode.FokontanyNotFound,
          StatusCodes.NOT_FOUND,
          { message: "Fokontany not found at the location coordinates" },
        );
      }
      return c.json(fokontany, StatusCodes.OK);
    },
  );
