import type { DbConnection, MadaAdmConfigValues } from "@scope/types/db";
import { DbType } from "@scope/consts/db";
import type { MongoDbConnection } from "@scope/adapters/mongo";
import type { PostgresDbConnection } from "@scope/adapters/postgres";
import type { SqliteDbConnection } from "@scope/adapters/sqlite";
import type { MySQLDbConnection } from "@scope/adapters/mysql";
import type { QueriesExtraOptions } from "../queries.d.ts";
import type { DistrictQueries } from "../queries.d.ts";

export async function injectDistrictQueries(
  config: MadaAdmConfigValues,
  dbType: DbType,
  dbConnection: DbConnection,
  extra?: QueriesExtraOptions,
): Promise<DistrictQueries> {
  switch (dbType) {
    case DbType.MongoDB: {
      const { injectDistrictMongoQueries } = await import(
        "./district.mongo.queries.ts"
      );
      return injectDistrictMongoQueries(
        config,
        dbConnection as MongoDbConnection,
      );
    }
    case DbType.Postgres: {
      const { injectDistrictPostgresQueries } = await import(
        "./district.postgres.queries.ts"
      );
      return injectDistrictPostgresQueries(
        config,
        dbConnection as PostgresDbConnection,
        extra?.pgSchema,
      );
    }
    case DbType.SQLite: {
      const { injectDistrictSqliteQueries } = await import(
        "./district.sqlite.queries.ts"
      );
      return injectDistrictSqliteQueries(
        config,
        dbConnection as SqliteDbConnection,
      );
    }
    case DbType.MySQL: {
      const { injectDistrictMySQLQueries } = await import(
        "./district.mysql.queries.ts"
      );
      return injectDistrictMySQLQueries(
        config,
        dbConnection as MySQLDbConnection,
      );
    }

    default: {
      throw new Error(
        `Unsupported database type: ${dbType} for district queries`,
      );
    }
  }
}
