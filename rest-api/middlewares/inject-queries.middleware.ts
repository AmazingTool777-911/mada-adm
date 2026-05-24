import { createMiddleware } from "hono/factory";
import type { RestApiEnv } from "../rest-api.d.ts";
import { injectProvinceQueries } from "@scope/queries/province";
import { injectRegionQueries } from "@scope/queries/region";
import { injectDistrictQueries } from "@scope/queries/district";

export type ContextQueriesKeys = Extract<
  keyof RestApiEnv["Variables"],
  "provinceQueries" | "regionQueries" | "districtQueries"
>;

export const injectQueriesMiddleware = (
  ...queriesKeys: ContextQueriesKeys[]
) => {
  return createMiddleware<RestApiEnv>(async (c, next) => {
    const config = c.get("config");
    const madaAdmConfig = c.get("madaAdmConfig");
    const db = c.get("db");

    for (const key of queriesKeys) {
      switch (key) {
        case "provinceQueries":
          c.set(
            "provinceQueries",
            await injectProvinceQueries(madaAdmConfig, config.dbType, db, {
              pgSchema: config.pgSchema,
            }),
          );
          break;
        case "regionQueries":
          c.set(
            "regionQueries",
            await injectRegionQueries(madaAdmConfig, config.dbType, db, {
              pgSchema: config.pgSchema,
            }),
          );
          break;
        case "districtQueries":
          c.set(
            "districtQueries",
            await injectDistrictQueries(madaAdmConfig, config.dbType, db, {
              pgSchema: config.pgSchema,
            }),
          );
          break;

        default:
          break;
      }
    }

    await next();
  });
};
