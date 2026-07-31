import type { DbConnection, MadaAdmConfigValues } from "@scope/types/db";
import { DbType } from "@scope/consts/db";
import type { MongoDbConnection } from "@scope/adapters/mongo";
import type { PostgresDbConnection } from "@scope/adapters/postgres";
import type { SqliteDbConnection } from "@scope/adapters/sqlite";
import type { MySQLDbConnection } from "@scope/adapters/mysql";
import type { ProvinceQueries, QueriesExtraOptions } from "../queries.d.ts";

export async function injectProvinceQueries(
  config: MadaAdmConfigValues,
  dbType: DbType,
  dbConnection: DbConnection,
  extra?: QueriesExtraOptions,
): Promise<ProvinceQueries> {
  switch (dbType) {
    case DbType.MongoDB: {
      const { injectProvinceMongoQueries } = await import(
        "./province.mongo.queries.ts"
      );
      return injectProvinceMongoQueries(
        config,
        dbConnection as MongoDbConnection,
      );
    }
    case DbType.Postgres: {
      const { injectProvincePostgresQueries } = await import(
        "./province.postgres.queries.ts"
      );
      return injectProvincePostgresQueries(
        config,
        dbConnection as PostgresDbConnection,
        extra?.pgSchema,
      );
    }
    case DbType.SQLite: {
      const { injectProvinceSqliteQueries } = await import(
        "./province.sqlite.queries.ts"
      );
      return injectProvinceSqliteQueries(
        config,
        dbConnection as SqliteDbConnection,
      );
    }
    case DbType.MySQL: {
      const { injectProvinceMySQLQueries } = await import(
        "./province.mysql.queries.ts"
      );
      return injectProvinceMySQLQueries(
        config,
        dbConnection as MySQLDbConnection,
      );
    }

    default: {
      throw new Error(
        `Unsupported database type: ${dbType} for province queries`,
      );
    }
  }
}
