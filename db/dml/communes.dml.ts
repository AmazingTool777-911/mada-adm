import { DbType } from "@scope/consts/db";
import type { CommuneTableDML, DbConnection } from "@scope/types/db";
import type { DbDDLExtraOptionsCliConfig } from "@scope/types/cli";
import type { MadaAdmConfigValues } from "@scope/types/models";
import {
  injectCommunesPostgresDML,
  type PostgresDbConnection,
} from "@scope/adapters/postgres";

import {
  injectCommunesSqliteDML,
  type SqliteDbConnection,
} from "@scope/adapters/sqlite";

import {
  injectCommunesMySQLDML,
  type MySQLDbConnection,
} from "@scope/adapters/mysql";

import {
  injectCommunesMongoDML,
  type MongoDbConnection,
} from "@scope/adapters/mongo";
import type { MadaAdmConfig } from "@scope/types/models";

/**
 * Injects (or creates) an instance of the communes table DML adapter based on the database type.
 *
 * @param config - The runtime ADM configuration.
 * @param dbType - The target database type.
 * @param db - The active database connection.
 * @param options - Extra CLI configuration options including schema.
 * @returns The instance of the communes table DML adapter.
 * @throws {Error} If the database type is unsupported.
 */
export function injectCommunesDML(
  config: MadaAdmConfigValues,
  dbType: DbType,
  db: DbConnection,
  options?: DbDDLExtraOptionsCliConfig,
): CommuneTableDML {
  switch (dbType) {
    case DbType.Postgres:
      return injectCommunesPostgresDML(
        config,
        db as PostgresDbConnection,
        options?.pgSchema,
      );
    case DbType.SQLite:
      return injectCommunesSqliteDML(
        config,
        db as SqliteDbConnection,
      );
    case DbType.MySQL:
      return injectCommunesMySQLDML(
        config,
        db as MySQLDbConnection,
      );
    case DbType.MongoDB:
      return injectCommunesMongoDML(
        config as MadaAdmConfig,
        db as MongoDbConnection,
      );
    default:
      throw new Error(
        `Unsupported database type for communes DML: ${dbType}`,
      );
  }
}
