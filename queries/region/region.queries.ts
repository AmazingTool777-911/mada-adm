import type { DbConnection, MadaAdmConfigValues } from "@scope/types/db";
import { DbType } from "@scope/consts/db";
import type { MongoDbConnection } from "@scope/adapters/mongo";
import type { PostgresDbConnection } from "@scope/adapters/postgres";
import type { SqliteDbConnection } from "@scope/adapters/sqlite";
import type { MySQLDbConnection } from "@scope/adapters/mysql";
import type { QueriesExtraOptions, RegionQueries } from "../queries.d.ts";

export async function injectRegionQueries(
  config: MadaAdmConfigValues,
  dbType: DbType,
  dbConnection: DbConnection,
  extra?: QueriesExtraOptions,
): Promise<RegionQueries> {
  switch (dbType) {
    case DbType.MongoDB: {
      const { injectRegionMongoQueries } = await import(
        "./region.mongo.queries.ts"
      );
      return injectRegionMongoQueries(
        config,
        dbConnection as MongoDbConnection,
      );
    }
    case DbType.Postgres: {
      const { injectRegionPostgresQueries } = await import(
        "./region.postgres.queries.ts"
      );
      return injectRegionPostgresQueries(
        config,
        dbConnection as PostgresDbConnection,
        extra?.pgSchema,
      );
    }
    case DbType.SQLite: {
      const { injectRegionSqliteQueries } = await import(
        "./region.sqlite.queries.ts"
      );
      return injectRegionSqliteQueries(
        config,
        dbConnection as SqliteDbConnection,
      );
    }
    case DbType.MySQL: {
      const { injectRegionMySQLQueries } = await import(
        "./region.mysql.queries.ts"
      );
      return injectRegionMySQLQueries(
        config,
        dbConnection as MySQLDbConnection,
      );
    }

    default: {
      throw new Error(
        `Unsupported database type: ${dbType} for region queries`,
      );
    }
  }
}
