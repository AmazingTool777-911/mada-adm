import * as path from "@std/path";
import { type Db, MongoClient, ServerApiVersion } from "mongodb";

import { DB_CA_CERTIFICATES_DIR, DbType } from "@scope/consts/db";
import type {
  DbConnection,
  DbConnectionParams,
  DbTransactionContext,
  MongoDbConnectionParams,
  MongoDbTransactionContext,
  TransactionOptions,
} from "@scope/types/db";
import type { MaybePromise } from "@scope/types/utils";

/**
 * Implementation of a database connection specifically for MongoDB.
 * It manages the underlying MongoClient, Db instance, and provides
 * transaction support with session management.
 */
export class MongoDbConnection implements DbConnection {
  /** The native MongoClient. */
  #client: MongoClient | null = null;

  /** The target database instance. */
  #db: Db | null = null;

  /** The latest connection params used. */
  #params: MongoDbConnectionParams | null = null;

  /**
   * Getter for the latest connection params used to connect to the database.
   */
  get params(): MongoDbConnectionParams {
    if (!this.#params) {
      throw new Error(
        "MongoDB connection params have not been set. Call connect() first.",
      );
    }
    return this.#params;
  }

  /**
   * Native getter for the MongoClient.
   */
  get client(): MongoClient {
    if (!this.#client) {
      throw new Error(
        "MongoClient has not been initialized. Call connect() first.",
      );
    }
    return this.#client;
  }

  /**
   * Native getter for the target Database instance.
   */
  get db(): Db {
    if (!this.#db) {
      throw new Error(
        "MongoDB database instance has not been initialized. Call connect() first.",
      );
    }
    return this.#db;
  }

  /**
   * Establishes a connection to a MongoDB database.
   * Supports re-initialization by closing any existing connection before creating a new one.
   *
   * @param params - The connection parameters, including database type and connection details.
   * @throws {Error} If the provided database type is not MongoDB.
   */
  async connect(params: DbConnectionParams): Promise<void> {
    if (params.dbType !== DbType.MongoDB) {
      throw new Error(
        `Unsupported database type: ${params.dbType}. Expected ${DbType.MongoDB}.`,
      );
    }

    // Support re-initialization by closing existing client if it exists
    if (this.#client) {
      await this.close();
    }

    this.#params = params;
    const config = params;

    const uri = config.uri;

    const tlsCAFile = config.tlsCaFile
      ? path.join(Deno.cwd(), DB_CA_CERTIFICATES_DIR, config.tlsCaFile)
      : config.tlsCaPath;

    const tlsCertificateKeyFile = config.tlsCertKeyFile
      ? path.join(
        Deno.cwd(),
        DB_CA_CERTIFICATES_DIR,
        config.tlsCertKeyFile,
      )
      : config.tlsCertKeyPath;

    this.#client = new MongoClient(uri, {
      // API versioning
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },

      // Connection pool
      maxPoolSize: config.poolSize,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,

      // Retry
      retryWrites: true,
      retryReads: true,

      // TLS
      tls: config.tls,
      tlsCAFile,
      tlsCertificateKeyFile,
      tlsCertificateKeyFilePassword: config.tlsCertPassword,
      tlsAllowInvalidCertificates: config.tlsAllowInvalidCertificates ?? false,
      tlsAllowInvalidHostnames: config.tlsAllowInvalidHostnames ?? false,
    });

    await this.#client.connect();

    // The database name can be passed in params or parsed from URI by MongoClient.
    // If config.database is provided, we use it to explicitly target the database.
    this.#db = this.#client.db(config.database);
  }

  /**
   * Closes the active MongoClient.
   * If no client is active, this method does nothing.
   */
  async close(): Promise<void> {
    if (this.#client) {
      await this.#client.close();
      this.#client = null;
      this.#db = null;
    }
  }

  /**
   * Executes a callback function within a MongoDB transaction.
   * Starts a session, handles automatic COMMIT and ABORT operations,
   * and ends the session when done.
   *
   * @param callback - The asynchronous function to execute within the transaction.
   * @returns The resolved value of the callback function.
   * @throws {Error} If the transaction fails or the callback throws an error.
   */
  async transaction<T>(
    callback: (transactionContext: DbTransactionContext) => MaybePromise<T>,
    options?: TransactionOptions,
  ): Promise<T> {
    const session = this.client.startSession();

    try {
      session.startTransaction({
        readConcern: { level: options?.mongo?.readConcern ?? "snapshot" },
        writeConcern: { w: "majority" },
      });

      const result = await callback({
        dbType: DbType.MongoDB,
        session,
      } as MongoDbTransactionContext);

      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

let _instance: MongoDbConnection | null = null;

/**
 * Injects (or creates if necessary) the singleton instance of {@link MongoDbConnection}.
 *
 * @returns The singleton instance of the MongoDB database connection.
 */
export function injectMongoDbConnection(): MongoDbConnection {
  if (!_instance) {
    _instance = new MongoDbConnection();
  }
  return _instance;
}
