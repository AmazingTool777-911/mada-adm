import { createMiddleware } from "@hono/hono/factory";

import { injectMadaAdmConfigDML } from "@scope/db";
import type { MadaAdmConfig } from "@scope/types/models";

import type { RestApiEnv } from "../rest-api.d.ts";

let configInstance: MadaAdmConfig | null = null;

export const loadConfigMiddleware = createMiddleware<RestApiEnv>(
  async (c, next) => {
    const db = c.get("db");
    const config = c.get("config");

    if (!db || !config) {
      return c.json(
        { error: "Database connection has not been initialized." },
        500,
      );
    }

    try {
      if (!configInstance) {
        const dml = await injectMadaAdmConfigDML(config.dbType, db);
        configInstance = await dml.get();
      }

      if (!configInstance) {
        return c.json(
          { error: "The mada adm config was not found." },
          404,
        );
      }

      c.set("madaAdmConfig", configInstance);
    } catch (_error) {
      return c.json(
        { error: "An error occurred during the fetch of the config." },
        500,
      );
    }

    await next();
  },
);
