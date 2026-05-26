import { DbType } from "@scope/consts/db";

import type { DbConnectionCliConfig } from "@scope/types/cli";
import type { DbConnection, DbConnectionParams } from "@scope/types/db";

/**
 * Injects a database connection instance based on the specified database type.
 *
 * @param dbType - The type of database connection to inject.
 * @returns The singleton instance of the appropriate DbConnection.
 * @throws {Error} If the requested database type is not supported.
 */
export async function injectDbConnection(
  dbType: DbType,
): Promise<DbConnection> {
  switch (dbType) {
    case DbType.Postgres: {
      const { injectPostgresDbConnection } = await import(
        "@scope/adapters/postgres/db"
      );
      return injectPostgresDbConnection();
    }
    case DbType.MySQL: {
      const { injectMySQLDbConnection } = await import(
        "@scope/adapters/mysql/db"
      );
      return injectMySQLDbConnection();
    }
    case DbType.SQLite: {
      const { injectSqliteDbConnection } = await import(
        "@scope/adapters/sqlite/db"
      );
      return injectSqliteDbConnection();
    }
    case DbType.MongoDB: {
      const { injectMongoDbConnection } = await import(
        "@scope/adapters/mongo/db"
      );
      return injectMongoDbConnection();
    }
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
      const { PostgresDbConnection } = await import(
        "@scope/adapters/postgres/db"
      );
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
      const { SqliteDbConnection } = await import(
        "@scope/adapters/sqlite/db"
      );
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
      const { MySQLDbConnection } = await import(
        "@scope/adapters/mysql/db"
      );
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
          connectionLimit: mysql.connectionLimit,
          maxIdle: mysql.maxIdle,
          idleTimeout: mysql.idleTimeout,
        },
      };
      break;
    }
    case DbType.MongoDB: {
      const { MongoDbConnection } = await import(
        "@scope/adapters/mongo/db"
      );
      if (!(connection instanceof MongoDbConnection)) {
        throw new Error(
          "Invalid connection instance: Expected MongoDbConnection for MongoDB database type.",
        );
      }
      const mongo = config.mongo;
      params = {
        dbType: DbType.MongoDB,
        uri: mongo.uri,
        poolSize: mongo.poolSize,
        database: mongo.database,
        tls: mongo.tls,
        tlsCaFile: mongo.tlsCaFile,
        tlsCaPath: mongo.tlsCaPath,
        tlsCertKeyFile: mongo.tlsCertKeyFile,
        tlsCertKeyPath: mongo.tlsCertKeyPath,
        tlsCertPassword: mongo.tlsCertPassword,
        tlsAllowInvalidCertificates: mongo.tlsAllowInvalidCertificates,
        tlsAllowInvalidHostnames: mongo.tlsAllowInvalidHostnames,
      };
      break;
    }
    default:
      throw new Error(`Unsupported database type: ${config.dbType}`);
  }

  await connection.connect(params);
}
