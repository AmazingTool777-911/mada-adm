import * as path from "@std/path";

import { Pool } from "@db/postgres";

import { DB_CA_CERTIFICATES_DIR, DbType } from "@scope/consts/db";
import type {
  DbConnection,
  DbConnectionParams,
  DbTransactionContext,
} from "@scope/types/db";
import type { MaybePromise } from "@scope/types/utils";

/** Default number of connections in the PostgreSQL pool. */
const DEFAULT_PG_POOL_SIZE = 10;

/**
 * Implementation of a database connection specifically for PostgreSQL.
 * It manages the underlying PostgreSQL connection pool and provides
 * transaction support with automatic pool client lifecycle management.
 */
export class PostgresDbConnection implements DbConnection {
  /** The native PostgreSQL connection pool. */
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
        "PostgreSQL connection params have not been set. Call connect() first.",
      );
    }
    return this.#params;
  }

  /**
   * Native getter for the PostgreSQL connection pool.
   *
   * @returns The active PostgreSQL connection pool.
   * @throws {Error} If the pool has not been initialized through a call to {@link connect}.
   */
  get pool(): Pool {
    if (!this.#pool) {
      throw new Error(
        "PostgreSQL pool has not been initialized. Call connect() first.",
      );
    }
    return this.#pool;
  }

  /**
   * Establishes a connection pool to a PostgreSQL database.
   * Supports re-initialization by closing any existing pool before creating a new one.
   *
   * @param params - The connection parameters, including database type and connection details.
   * @throws {Error} If the provided database type is not PostgreSQL.
   */
  async connect(params: DbConnectionParams): Promise<void> {
    if (params.dbType !== DbType.Postgres) {
      throw new Error(
        `Unsupported database type: ${params.dbType}. Expected ${DbType.Postgres}.`,
      );
    }

    // Support re-initialization by ending existing pool if it exists
    if (this.#pool) {
      await this.#pool.end();
    }

    this.#params = params;

    if (typeof params.connection === "string") {
      this.#pool = new Pool(params.connection, DEFAULT_PG_POOL_SIZE);
    } else {
      const config = params.connection;
      const poolSize = config.connectionLimit ?? DEFAULT_PG_POOL_SIZE;

      let caCertificates: string[] | undefined;
      if (config.ssl) {
        const certPath = config.caCertFile
          ? path.join(Deno.cwd(), DB_CA_CERTIFICATES_DIR, config.caCertFile)
          : config.caCertPath;
        if (certPath) {
          const certContent = await Deno.readTextFile(certPath);
          caCertificates = [certContent];
        }
      }

      this.#pool = new Pool(
        {
          hostname: config.host,
          port: config.port,
          user: config.username,
          password: config.password,
          database: config.database,
          tls: {
            enabled: config.ssl ?? true,
            enforce: config.ssl ?? false,
            caCertificates,
          },
        },
        poolSize,
      );
    }

    const client = await this.#pool.connect();
    try {
      await client.queryObject("CREATE EXTENSION IF NOT EXISTS citext;");
    } finally {
      client.release();
    }
  }

  /**
   * Closes the active PostgreSQL connection pool.
   * If no pool is active, this method does nothing.
   */
  async close(): Promise<void> {
    if (this.#pool) {
      await this.#pool.end();
      this.#pool = null;
    }
  }

  /**
   * Executes a callback function within a PostgreSQL transaction.
   * Acquires a client from the pool, handles automatic BEGIN, COMMIT, and
   * ROLLBACK operations, and releases the client back to the pool when done.
   *
   * @param callback - The asynchronous function to execute within the transaction.
   * @returns The resolved value of the callback function.
   * @throws {Error} If the transaction fails or the callback throws an error.
   */
  async transaction<T>(
    callback: (transactionContext: DbTransactionContext) => MaybePromise<T>,
  ): Promise<T> {
    const poolClient = await this.pool.connect();
    const transaction = poolClient.createTransaction(crypto.randomUUID());

    try {
      await transaction.begin();
      const result = await callback({
        dbType: DbType.Postgres,
        tx: transaction,
      });
      await transaction.commit();
      return result;
    } catch (error) {
      console.log(error);
      await transaction.rollback();
      throw error;
    } finally {
      poolClient.release();
    }
  }
}

let _instance: PostgresDbConnection | null = null;

/**
 * Injects (or creates if necessary) the singleton instance of {@link PostgresDbConnection}.
 *
 * @returns The singleton instance of the PostgreSQL database connection.
 */
export function injectPostgresDbConnection(): PostgresDbConnection {
  if (!_instance) {
    _instance = new PostgresDbConnection();
  }
  return _instance;
}
