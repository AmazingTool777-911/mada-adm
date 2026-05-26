import { DbType } from "@scope/consts/db";
import type { DbConnection } from "@scope/types/db";
import type { AdmEntityQueries, QueriesExtraOptions } from "../queries.d.ts";
import type { MadaAdmConfigValues } from "@scope/types/models";
import type { PostgresDbConnection } from "@scope/adapters/postgres/db";
import type { SqliteDbConnection } from "@scope/adapters/sqlite/db";
import type { MySQLDbConnection } from "@scope/adapters/mysql/db";
import type { MongoDbConnection } from "@scope/adapters/mongo/db";

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
    case DbType.SQLite: {
      const { injectAdmEntitySqliteQueries } = await import(
        "./adm-entity.sqlite.queries.ts"
      );
      return injectAdmEntitySqliteQueries(
        config,
        dbConnection as SqliteDbConnection,
      );
    }
    case DbType.MySQL: {
      const { injectAdmEntityMySQLQueries } = await import(
        "./adm-entity.mysql.queries.ts"
      );
      return injectAdmEntityMySQLQueries(
        config,
        dbConnection as MySQLDbConnection,
      );
    }
    case DbType.MongoDB: {
      const { injectAdmEntityMongoQueries } = await import(
        "./adm-entity.mongo.queries.ts"
      );
      return injectAdmEntityMongoQueries(
        config,
        dbConnection as MongoDbConnection,
      );
    }
    default: {
      throw new Error(
        `Unsupported dbType: ${dbType satisfies never} when injecting adm entity queries`,
      );
    }
  }
}
