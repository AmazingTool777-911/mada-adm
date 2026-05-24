import type { DbConnection, MadaAdmConfigValues } from "@scope/types/db";
import { DbType } from "@scope/consts/db";
import type { MongoDbConnection } from "@scope/adapters/mongo";
import type { PostgresDbConnection } from "@scope/adapters/postgres";
import type { SqliteDbConnection } from "@scope/adapters/sqlite";
import type { MySQLDbConnection } from "@scope/adapters/mysql";
import type { QueriesExtraOptions } from "../queries.d.ts";
import type { FokontanyQueries } from "../queries.d.ts";

export async function injectFokontanyQueries(
  config: MadaAdmConfigValues,
  dbType: DbType,
  dbConnection: DbConnection,
  extra?: QueriesExtraOptions,
): Promise<FokontanyQueries> {
  switch (dbType) {
    case DbType.MongoDB: {
      const { injectFokontanyMongoQueries } = await import(
        "./fokontany.mongo.queries.ts"
      );
      return injectFokontanyMongoQueries(
        config,
        dbConnection as MongoDbConnection,
      );
    }
    case DbType.Postgres: {
      const { injectFokontanyPostgresQueries } = await import(
        "./fokontany.postgres.queries.ts"
      );
      return injectFokontanyPostgresQueries(
        config,
        dbConnection as PostgresDbConnection,
        extra?.pgSchema,
      );
    }
    case DbType.SQLite: {
      const { injectFokontanySqliteQueries } = await import(
        "./fokontany.sqlite.queries.ts"
      );
      return injectFokontanySqliteQueries(
        config,
        dbConnection as SqliteDbConnection,
      );
    }
    case DbType.MySQL: {
      const { injectFokontanyMySQLQueries } = await import(
        "./fokontany.mysql.queries.ts"
      );
      return injectFokontanyMySQLQueries(
        config,
        dbConnection as MySQLDbConnection,
      );
    }

    default: {
      throw new Error(
        `Unsupported database type: ${dbType} for fokontany queries`,
      );
    }
  }
}
