import { DbType } from "@scope/consts/db";
import type { DbConnection } from "@scope/types/db";
import type { AdmEntityQueries, QueriesExtraOptions } from "../queries.d.ts";
import type { MadaAdmConfigValues } from "@scope/types/models";
import type { PostgresDbConnection } from "@scope/adapters/postgres/db";

export async function injectAdmEntityQueries(
  config: MadaAdmConfigValues,
  dbType: DbType,
  dbConnection: DbConnection,
  extra?: QueriesExtraOptions,
): Promise<AdmEntityQueries> {
  switch (dbType) {
    case DbType.Postgres: {
      const { injectAdmEntityPostgresQueries } = await import(
        "./adm-entity.postgres.queries.ts"
      );
      return injectAdmEntityPostgresQueries(
        config,
        dbConnection as PostgresDbConnection,
        extra?.pgSchema,
      );
    }
    default: {
      throw new Error(`Unsupported dbType: ${dbType}`);
    }
  }
}
