import type { DbConnection, MadaAdmConfigValues } from "@scope/types/db";
import { DbType } from "@scope/consts/db";
import type { MongoDbConnection } from "@scope/adapters/mongo";
import type { PostgresDbConnection } from "@scope/adapters/postgres";
import type { SqliteDbConnection } from "@scope/adapters/sqlite";
import type { MySQLDbConnection } from "@scope/adapters/mysql";
import type { QueriesExtraOptions } from "../queries.d.ts";
import type { CommuneQueries } from "../queries.d.ts";

export async function injectCommuneQueries(
  config: MadaAdmConfigValues,
  dbType: DbType,
  dbConnection: DbConnection,
  extra?: QueriesExtraOptions,
): Promise<CommuneQueries> {
  switch (dbType) {
    case DbType.MongoDB: {
      const { injectCommuneMongoQueries } = await import(
        "./commune.mongo.queries.ts"
      );
      return injectCommuneMongoQueries(
        config,
        dbConnection as MongoDbConnection,
      );
    }
    case DbType.Postgres: {
      const { injectCommunePostgresQueries } = await import(
        "./commune.postgres.queries.ts"
      );
      return injectCommunePostgresQueries(
        config,
        dbConnection as PostgresDbConnection,
        extra?.pgSchema,
      );
    }
    case DbType.SQLite: {
      const { injectCommuneSqliteQueries } = await import(
        "./commune.sqlite.queries.ts"
      );
      return injectCommuneSqliteQueries(
        config,
        dbConnection as SqliteDbConnection,
      );
    }
    case DbType.MySQL: {
      const { injectCommuneMySQLQueries } = await import(
        "./commune.mysql.queries.ts"
      );
      return injectCommuneMySQLQueries(
        config,
        dbConnection as MySQLDbConnection,
      );
    }

    default: {
      throw new Error(
        `Unsupported database type: ${dbType} for commune queries`,
      );
    }
  }
}
