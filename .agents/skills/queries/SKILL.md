---
name: queries
description: >
  Use this skill whenever defining, generating, modifying, or understanding
  database queries in this project. It outlines the specific patterns and
  architectures expected for the `@scope/queries` workspace package.
---

# Defining Queries in `mada-adm`

The `queries` package (`/queries`) abstracts all database query implementations. Because `mada-adm` supports multiple database engines (MongoDB, Postgres, MySQL, SQLite), queries must be strictly organized by administrative level and database type.

## 1. Directory Structure

Each administrative level has its own sub-directory under `/queries` (e.g., `/queries/province`, `/queries/region`).
Inside each sub-directory, you must provide:

- **Injector file**: `[level].queries.ts`. This file exports a root injection function (e.g., `injectProvinceQueries`) that dynamically/lazily imports and returns the correct query instance based on the `DbType`.
- **Implementation files**: One for each supported database:
  - `[level].mongo.queries.ts`
  - `[level].postgres.queries.ts`
  - `[level].mysql.queries.ts`
  - `[level].sqlite.queries.ts`

## 2. Base Classes and Interfaces

- **Interfaces**: Define the shape of your queries in `queries/queries.d.ts` (e.g., `ProvinceQueries`, `DistrictQueries`).
- **Base Class**: Query implementations should extend `BaseAdmTableQueries` (from `queries/adm-table.queries.ts`), which handles dynamic table name resolution (`this.tableName`) and column retrieval (`this.getColunmsWithoutGeojson`).

## 3. Implementation Pattern

Each specific database implementation file must:
1. Export a class that extends `BaseAdmTableQueries` and implements the corresponding queries interface from `queries.d.ts`.
2. Maintain a singleton instance locally via a private module-level variable.
3. Export an injection function (`inject[Level][Db]Queries`) that creates or returns the singleton instance.

### Example (Postgres)
```ts
import type { MadaAdmConfigValues, Province, ProvinceSnakeCased } from "@scope/types/models";
import type { PostgresDbConnection } from "@scope/adapters/postgres";
import { mapProvinceSnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import { AdmLevelCode } from "@scope/consts/models";
import type { ProvinceQueries } from "../queries.d.ts";
import { BaseAdmTableQueries } from "../adm-table.queries.ts";

export class ProvincePostgresQueries extends BaseAdmTableQueries implements ProvinceQueries {
  #db!: PostgresDbConnection;
  #pgSchema!: string;

  constructor(config: MadaAdmConfigValues, db: PostgresDbConnection, pgSchema: string = "public") {
    super(config, DbType.Postgres, AdmLevelCode.PROVINCE);
    this.#db = db;
    this.#pgSchema = pgSchema;
  }

  async getAll(): Promise<Province[]> {
    const client = await this.#db.pool.connect();
    const columns = this.getColunmsWithoutGeojson({ excludeGeojson: true });
    const sql = `SELECT ${columns.join(", ")} FROM ${this.#pgSchema}.${this.tableName}`;
    
    const rows = await client.queryObject<ProvinceSnakeCased>(sql);
    return rows.rows.map(mapProvinceSnakeToCamel);
  }
}

let _instance: ProvincePostgresQueries | null = null;

export function injectProvincePostgresQueries(
  config: MadaAdmConfigValues,
  db: PostgresDbConnection,
  pgSchema?: string,
): ProvincePostgresQueries {
  return _instance ?? (_instance = new ProvincePostgresQueries(config, db, pgSchema));
}
```

## 4. Case Mapping

- SQL databases store and return `snake_case` fields, corresponding to `[Model]SnakeCased` types.
- Query classes are responsible for mapping raw SQL results to the application's `camelCase` models before returning them. Always use mapping helpers from `@scope/helpers/models` (e.g., `mapProvinceSnakeToCamel`, `mapDistrictSnakeToCamel`).

## 5. Pagination

For lower-level ADMs (District, Commune, Fokontany) that return large datasets, always implement cursor-based pagination.
- Use `wrapCursorPaginatedQuery` from `queries/helpers.ts` to standardise paginated results.
- Implement the underlying logic to fetch `limit + 1` records, which `wrapCursorPaginatedQuery` uses to calculate the `next` cursor.
- Use predefined types like `CursorPaginationParams` and `CursorPaginatedResult` from `queries/queries.d.ts`.

## 6. Workspace Exports

When you add a new administrative level query directory, you must export its main injector module as a subpath in the workspace member's `deno.json`.

```json
{
  "exports": {
    "./province": "./province/province.queries.ts",
    "./region": "./region/region.queries.ts"
  }
}
```
This ensures that other workspace packages can import the queries directly via `@scope/queries/region`.

## 7. Filtering and Security Rules

1. **Parameterized Filters**: All SQL filtering values (such as search inputs or foreign keys) must be parameterized (e.g., using `?` or `$1`) to prevent SQL injection and properly handle variables.
2. **SQL Prefix Search**: When handling a `search` parameter in SQL databases, it should perform a "starts with" lookup. You must append `%` to the parameterised value in your queries (`LIKE ?`, parameter bound to `search + '%'`).
3. **MongoDB Prefix Search**: Do not use `$regex` for prefix searches in MongoDB. Instead, use the `$gte` and `$lt` range trick. For example, a search for `"Anta"` uses `{ $gte: "Anta", $lt: "Antb" }` (by incrementing the final character code by 1).
4. **Configuration Validation**: The database comes with a `MadaAdmConfig` describing its schema constraints. When processing query parameters that filter by a parent or province, you must check if the configuration replicates that foreign key.
   - For `Commune` and `Fokontany`, if an ancestor (non-direct parent) is passed but `isFkRepeated` is false, throw `ForeignKeysNotRepeatedError`.
   - For `District`, `Commune`, and `Fokontany`, if `provinceId` is passed but `isProvinceFkRepeated` is false, throw `ProvinceForeignKeyNotRepeatedError`.
   - Both error types reside in `@scope/queries/helpers.ts`.
