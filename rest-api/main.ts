import { Hono } from "@hono/hono";
import { StatusCodes } from "http-status-codes";

import { connectDbMiddleware } from "./middlewares/connect-db.middleware.ts";
import { loadConfigMiddleware } from "./middlewares/load-config.middleware.ts";
import { getDbConnection } from "./connect-db.ts";
import { provincesRouter } from "./routers/provinces.router.ts";
import { regionsRouter } from "./routers/regions.router.ts";
import { admEntitiesRouter } from "./routers/adm-entities.router.ts";
import { districtsRouter } from "./routers/districts.router.ts";
import { communesRouter } from "./routers/communes.router.ts";
import { fokontanysRouter } from "./routers/fokontanys.router.ts";
import { locationsRouter } from "./routers/locations.router.ts";
import { errorHandlerMiddleware } from "./middlewares/error-handler.middleware.ts";
import type { RestApiEnv } from "./rest-api.d.ts";

await getDbConnection();

const app = new Hono<RestApiEnv>()
  .use(connectDbMiddleware)
  .use(loadConfigMiddleware)
  .get("/", (c) => {
    return c.json({});
  })
  .get("/api/config", (c) => {
    const config = c.get("madaAdmConfig");
    return c.json(config, StatusCodes.OK);
  })
  .route("/api/adm_entities", admEntitiesRouter)
  .route("/api/provinces", provincesRouter)
  .route("/api/regions", regionsRouter)
  .route("/api/districts", districtsRouter)
  .route("/api/communes", communesRouter)
  .route("/api/fokontanys", fokontanysRouter)
  .route("/api/locations", locationsRouter)
  .onError(errorHandlerMiddleware);

const port = Deno.env.has("REST_API_PORT")
  ? Number(Deno.env.get("REST_API_PORT")!)
  : 8000;
Deno.serve({ port }, app.fetch);

export type AppType = typeof app;
