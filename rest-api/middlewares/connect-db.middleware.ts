import { createMiddleware } from "@hono/hono/factory";

import type { RestApiEnv } from "../rest-api.d.ts";
import { getDbConnection } from "../connect-db.ts";

export const connectDbMiddleware = createMiddleware<RestApiEnv>(
  async (c, next) => {
    try {
      const { db, config } = await getDbConnection();
      c.set("db", db);
      c.set("config", config);
    } catch (_error) {
      return c.json(
        { error: "The database connection failed." },
        500,
      );
    }

    await next();
  },
);
