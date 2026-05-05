import {
  injectPostgresDbConnection,
  PostgresDbConnection,
} from "@scope/adapters/postgres";
import {
  injectMySQLDbConnection,
  MySQLDbConnection,
} from "@scope/adapters/mysql";
import {
  injectSqliteDbConnection,
  SqliteDbConnection,
} from "@scope/adapters/sqlite";
import { DbType } from "@scope/consts/db";
import type { DbConnection, DbConnectionParams } from "@scope/types/db";
import type { DbConnectionCliConfig } from "@scope/types/cli";

/**
 * Injects a database connection instance based on the specified database type.
 *
 * @param dbType - The type of database connection to inject.
 * @returns The singleton instance of the appropriate DbConnection.
 * @throws {Error} If the requested database type is not supported.
 */
export function injectDbConnection(dbType: DbType): DbConnection {
  switch (dbType) {
    case DbType.Postgres:
      return injectPostgresDbConnection();
    case DbType.MySQL:
      return injectMySQLDbConnection();
    case DbType.SQLite:
      return injectSqliteDbConnection();
    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }
}

/**
 * Attempts to connect a database using the provided connection instance and parameters.
 * Validates that the underlying connection instance matches the required database type
 * specified in the parameters.
 *
 * @param connection - The database connection instance.
 * @param config - The database configuration from CLI arguments or environment variables.
 * @returns A promise that resolves when the connection is successfully established.
 * @throws {Error} If the connection instance is not of the expected class for the provided database type.
 */
export async function attemptDbConnection(
  connection: DbConnection,
  config: DbConnectionCliConfig,
): Promise<void> {
  let params!: DbConnectionParams;

  switch (config.dbType) {
    case DbType.Postgres: {
      if (!(connection instanceof PostgresDbConnection)) {
        throw new Error(
          "Invalid connection instance: Expected PostgresDbConnection for PostgreSQL database type.",
        );
      }
      const pg = config.pg;
      params = {
        dbType: DbType.Postgres,
        connection: pg.url ? pg.url : {
          host: pg.host,
          port: pg.port,
          username: pg.user,
          password: pg.password,
          database: pg.database,
          ssl: pg.ssl,
          caCertFile: pg.ssl ? pg.caCertFile : undefined,
          caCertPath: pg.ssl ? pg.caCertPath : undefined,
          connectionLimit: pg.connectionLimit,
        },
      };
      break;
    }
    case DbType.SQLite: {
      if (!(connection instanceof SqliteDbConnection)) {
        throw new Error(
          "Invalid connection instance: Expected SqliteDbConnection for SQLite database type.",
        );
      }
      params = {
        dbType: DbType.SQLite,
        dbPath: config.sqlite.dbPath,
        dbFile: config.sqlite.dbFile,
      };
      break;
    }
    case DbType.MySQL: {
      if (!(connection instanceof MySQLDbConnection)) {
        throw new Error(
          "Invalid connection instance: Expected MySQLDbConnection for MySQL database type.",
        );
      }
      const mysql = config.mysql;
      params = {
        dbType: DbType.MySQL,
        connection: mysql.url ? mysql.url : {
          host: mysql.host,
          port: mysql.port,
          username: mysql.user,
          password: mysql.password,
          database: mysql.database ?? "",
          ssl: mysql.ssl,
          caCertFile: mysql.ssl ? mysql.caCertFile : undefined,
          caCertPath: mysql.ssl ? mysql.caCertPath : undefined,
          certFile: mysql.ssl ? mysql.certFile : undefined,
          certPath: mysql.ssl ? mysql.certPath : undefined,
          keyFile: mysql.ssl ? mysql.keyFile : undefined,
          keyPath: mysql.ssl ? mysql.keyPath : undefined,
        },
      };
      break;
    }
    default:
      throw new Error(`Unsupported database type: ${config.dbType}`);
  }

  await connection.connect(params);
}
