---
name: hono-query-injection
description: >
  Use this skill whenever you need to add or manage database query instances
  within the Hono framework's context in the `rest-api` workspace. It defines
  how queries are strongly typed and selectively injected into routes.
---

# Injecting Queries into Hono Context

In the `rest-api` package, database queries are not imported directly into route
handlers. Instead, they are injected into the Hono context (`c`) via middleware.
This ensures that the database connection and configuration dependencies are
correctly resolved per request, and allows for easier mocking during testing.

## 1. Type Definitions (`rest-api.d.ts`)

Any query module you want to make available to Hono routes must first be
registered in the `RestApiEnv` type.

1. Import the corresponding query interface from `@scope/queries/types`.
2. Add a property to the `Variables` object inside `RestApiEnv`.

```ts
import type { ProvinceQueries, RegionQueries } from "@scope/queries/types";

export type RestApiEnv = {
  Variables: {
    db: DbConnection;
    config: GlobalCliConfigResolved;
    madaAdmConfig: MadaAdmConfig;

    // Add query interfaces here:
    provinceQueries: ProvinceQueries;
    regionQueries: RegionQueries;
  };
};
```

## 2. Middleware Injection (`inject-queries.middleware.ts`)

The `injectQueriesMiddleware` function is a factory that takes a variable list
of query keys and injects the requested queries into the Hono context before the
route handler executes.

### Updating `ContextQueriesKeys`

When you add a new query to `RestApiEnv`, you must explicitly add its key to the
`ContextQueriesKeys` union:

```ts
export type ContextQueriesKeys = Extract<
  keyof RestApiEnv["Variables"],
  "provinceQueries" | "regionQueries" | "yourNewQueries"
>;
```

### Implementing the Injection Factory

Inside the `injectQueriesMiddleware` loop, add a `case` statement for your new
query key. Use the specific query injector from the `@scope/queries` workspace
(e.g., `injectProvinceQueries`), passing it the required dependencies which are
already extracted from the context (`madaAdmConfig`, `config.dbType`, `db`,
etc.).

```ts
export const injectQueriesMiddleware = (
  ...queriesKeys: ContextQueriesKeys[]
) => {
  return createMiddleware<RestApiEnv>(async (c, next) => {
    // 1. Retrieve dependencies from the context
    const config = c.get("config");
    const madaAdmConfig = c.get("madaAdmConfig");
    const db = c.get("db");

    // 2. Loop through requested queries and inject them
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

          // ... Add your new case here
      }
    }

    await next();
  });
};
```

## 3. Usage in Routes

Once properly typed and handled by the middleware, you can securely apply the
middleware to any route, knowing that it will only instantiate and inject the
queries you explicitly request:

```ts
app.get(
  "/provinces",
  injectQueriesMiddleware("provinceQueries"),
  async (c) => {
    const provinceQueries = c.get("provinceQueries");
    const provinces = await provinceQueries.getAll();
    return c.json(provinces);
  },
);
```
