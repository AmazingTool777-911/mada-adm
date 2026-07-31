import { DbType } from "@scope/consts/db";
import type { DbConnection, MadaAdmConfigDML } from "@scope/types/db";
import type { DbDDLExtraOptionsCliConfig } from "@scope/types/cli";
import type { PostgresDbConnection } from "@scope/adapters/postgres";
import type { SqliteDbConnection } from "@scope/adapters/sqlite";
import type { MySQLDbConnection } from "@scope/adapters/mysql";
import type { MongoDbConnection } from "@scope/adapters/mongo";

/**
 * Injects (or creates) an instance of the mada adm config table DML adapter based on the database type.
 *
 * @param dbType - The target database type.
 * @param db - The active database connection.
 * @param options - Extra CLI configuration options including schema.
 * @returns The instance of the mada adm config table DML adapter.
 * @throws {Error} If the database type is unsupported.
 */
export async function injectMadaAdmConfigDML(
  dbType: DbType,
  db: DbConnection,
  options?: DbDDLExtraOptionsCliConfig,
): Promise<MadaAdmConfigDML> {
  switch (dbType) {
    case DbType.Postgres: {
      const { injectMadaAdmConfigPostgresDML } = await import(
        "@scope/adapters/postgres/dml/mada-adm-config"
      );
      return injectMadaAdmConfigPostgresDML(
        db as PostgresDbConnection,
        options?.pgSchema,
      );
    }
    case DbType.SQLite: {
      const { injectMadaAdmConfigSqliteDML } = await import(
        "@scope/adapters/sqlite/dml/mada-adm-config"
      );
      return injectMadaAdmConfigSqliteDML(
        db as SqliteDbConnection,
      );
    }
    case DbType.MySQL: {
      const { injectMadaAdmConfigMySQLDML } = await import(
        "@scope/adapters/mysql/dml/mada-adm-config"
      );
      return injectMadaAdmConfigMySQLDML(
        db as MySQLDbConnection,
      );
    }
    case DbType.MongoDB: {
      const { injectMadaAdmConfigMongoDML } = await import(
        "@scope/adapters/mongo/dml/mada-adm-config"
      );
      return injectMadaAdmConfigMongoDML(
        db as MongoDbConnection,
      );
    }
    default:
      throw new Error(
        `Unsupported database type for mada adm config DML: ${dbType}`,
      );
  }
}
