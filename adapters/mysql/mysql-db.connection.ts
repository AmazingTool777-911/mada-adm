import * as path from "@std/path";
import mysql from "mysql2/promise";
import type { Pool } from "mysql2/promise";

import { DB_CA_CERTIFICATES_DIR, DbType } from "@scope/consts/db";
import type {
  DbConnection,
  DbConnectionParams,
  DbTransactionContext,
} from "@scope/types/db";
import type { MaybePromise } from "@scope/types/utils";

/**
 * Implementation of a database connection specifically for MySQL.
 * It manages the underlying MySQL connection pool and provides transaction support.
 */
export class MySQLDbConnection implements DbConnection {
  /** The native MySQL pool instance. */
  #pool: Pool | null = null;

  /**
   * The latest db connection params used to connect to the database.
   */
  #params: DbConnectionParams | null = null;

  /**
   * Getter for the latest db connection params used to connect to the database.
   */
  get params(): DbConnectionParams {
    if (!this.#params) {
      throw new Error(
        "MySQL connection params have not been set. Call connect() first.",
      );
    }
    return this.#params;
  }

  /**
   * Native getter for the MySQL pool.
   *
   * @returns The active MySQL pool.
   * @throws {Error} If the pool has not been initialized through a call to {@link connect}.
   */
  get pool(): Pool {
    if (!this.#pool) {
      throw new Error(
        "MySQL pool has not been initialized. Call connect() first.",
      );
    }
    return this.#pool;
  }

  /**
   * Establishes a connection to a MySQL database.
   * Supports re-initialization by closing any existing connection before creating a new one.
   *
   * @param params - The connection parameters, including database type and connection details.
   * @throws {Error} If the provided database type is not MySQL.
   */
  async connect(params: DbConnectionParams): Promise<void> {
    if (params.dbType !== DbType.MySQL) {
      throw new Error(
        `Unsupported database type: ${params.dbType}. Expected ${DbType.MySQL}.`,
      );
    }

    // Support re-initialization by ending existing pool if it exists
    if (this.#pool) {
      await this.#pool.end();
    }

    this.#params = params;

    if (typeof params.connection === "string") {
      this.#pool = mysql.createPool(params.connection);
    } else {
      const config = params.connection;

      let sslConfig: mysql.ConnectionOptions["ssl"] | undefined;
      if (config.ssl) {
        sslConfig = {};
        const resolvePath = (file?: string, fullPath?: string) => {
          if (file) {
            const dbCaCertificatesDir = import.meta.dirname
              ? path.join(import.meta.dirname, "../../", DB_CA_CERTIFICATES_DIR)
              : path.join(Deno.cwd(), DB_CA_CERTIFICATES_DIR);
            return path.join(dbCaCertificatesDir, file);
          }
          return fullPath ? path.resolve(fullPath) : undefined;
        };

        const caCertPath = resolvePath(config.caCertFile, config.caCertPath);
        if (caCertPath) {
          sslConfig.ca = [await Deno.readTextFile(caCertPath)];
        }

        const certPath = resolvePath(config.certFile, config.certPath);
        const keyPath = resolvePath(config.keyFile, config.keyPath);
        if (certPath && keyPath) {
          sslConfig.cert = await Deno.readTextFile(certPath);
          sslConfig.key = await Deno.readTextFile(keyPath);
        }
      }

      const poolOptions: mysql.PoolOptions = {
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        waitForConnections: true,
        connectionLimit: config.connectionLimit,
      };

      if (sslConfig) {
        poolOptions.ssl = sslConfig;
      }

      this.#pool = mysql.createPool(poolOptions);
    }

    // Ping the database to verify credentials and connectivity
    const connection = await this.#pool.getConnection();
    connection.release();
  }

  /**
   * Closes the active MySQL connection pool.
   * If no connection is active, this method does nothing.
   */
  async close(): Promise<void> {
    if (this.#pool) {
      await this.#pool.end();
      this.#pool = null;
    }
  }

  /**
   * Executes a callback function within a MySQL transaction.
   * Handles automatic BEGIN, COMMIT, and ROLLBACK operations.
   *
   * @param callback - The asynchronous function to execute within the transaction.
   * @returns The resolved value of the callback function.
   * @throws {Error} If the transaction fails or the callback throws an error.
   */
  async transaction<T>(
    callback: (transactionContext: DbTransactionContext) => MaybePromise<T>,
  ): Promise<T> {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();
      const result = await callback({
        dbType: DbType.MySQL,
        connection: connection,
      });
      await connection.commit();
      return result;
    } catch (error) {
      console.log(error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

let _instance: MySQLDbConnection | null = null;

/**
 * Injects (or creates if necessary) the singleton instance of {@link MySQLDbConnection}.
 *
 * @returns The singleton instance of the MySQL database connection.
 */
export function injectMySQLDbConnection(): MySQLDbConnection {
  if (!_instance) {
    _instance = new MySQLDbConnection();
  }
  return _instance;
}
