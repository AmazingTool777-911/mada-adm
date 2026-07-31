import { Hono } from "@hono/hono";
import { StatusCodes } from "http-status-codes";
import * as z from "@zod/zod";
import { zValidator } from "@hono/zod-validator";

import {
  ADM_LEVEL_CODES_INDEXED,
  ADM_LEVEL_TITLE_BY_CODE,
  AdmLevelCode,
} from "@scope/consts/models";
import type {
  GetAdmEntitiesInBatchResponseBody,
  RestApiEnv,
} from "../rest-api.d.ts";
import { injectQueriesMiddleware } from "../middlewares/inject-queries.middleware.ts";
import { parseLimitQueryParam } from "../helpers/pagination.helper.ts";

export const admEntitiesRouter = new Hono<RestApiEnv>()
  .get(
    "in_batch",
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
      const data: GetAdmEntitiesInBatchResponseBody = await Promise.all([
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
          const paginatedDistricts = await districtQueries
            .getManyCursorPaginated(
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
  )
  .get(
    "in_union",
    zValidator(
      "query",
      z.object({
        limit: z.string().regex(/^\d+$/, "The limit must be a number")
          .optional(),
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
      const paginatedAdmEntities = await admEntityQueries
        .getUnionCursorPaginated(
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
