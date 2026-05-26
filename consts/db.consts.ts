import type { TransactionOptions } from "@scope/types/db";

/**
 * Supported database types.
 */
export enum DbType {
  Postgres = "postgres",
  MySQL = "mysql",
  SQLite = "sqlite",
  MongoDB = "mongodb",
}

/**
 * Directory under `db/` where CA certificate files are stored for secure
 * database adapter connections.
 */
export const DB_CA_CERTIFICATES_DIR: string = "db/.ca-certificates";

/**
 * Directory under `redis/` where certificate files are stored for secure
 * Redis connections.
 */
export const REDIS_CA_CERTIFICATES_DIR: string = "redis/.ca-certificates";

/**
 * Directory under `db/` where SQLite database files are stored.
 */
export const SQLITE_DB_DIR: string = "db/.sqlite";

/**
 * Default file name of the SQLite database file.
 */
export const SQLITE_DB_DEFAULT_FILE: string = "mada-adm.db";

/**
 * Default PostgreSQL schema name used when none is configured.
 */
export const DEFAULT_PG_SCHEMA: string = "public";

/**
 * Default database type used when none is configured.
 */
export const DEFAULT_DB_TYPE: DbType = DbType.SQLite;

/**
 * The physical table name of MadaAdmConfig.
 */
export const MADA_ADM_CONFIGS_TABLE_NAME_SNAKE_CASED: string =
  "mada_adm_configs";

/**
 * The physical table name (or collection name in MongoDB) of MadaAdmConfig.
 */
export const MADA_ADM_CONFIGS_TABLE_NAME_CAMEL_CASED: string = "madaAdmConfigs";

/**
 * MySQL collation for text columns.
 */
export const MYSQL_TEXT_COLUMN_COLLATION: string = "utf8mb4_0900_as_ci";

/**
 * Standard collation settings used for text fields and indices in MongoDB collections
 * for the ADM tables to support French language features like accents and case insensitivity.
 */
export const MONGO_FR_COLLATION = {
  locale: "fr",
  strength: 2,
  normalization: true,
  backwards: true,
} as const;

/**
 * MongoDB $jsonSchema properties for GeoJSON validation.
 */
export const MONGO_GEOJSON_VALIDATION = {
  bsonType: "object",
  required: ["type", "coordinates"],
  properties: {
    type: {
      bsonType: "string",
      enum: ["Polygon", "MultiPolygon"],
    },
    coordinates: { bsonType: "array" },
  },
} as const;

/**
 * Transaction options used by DDLs operations
 */
export const DDL_TRANSACTION_OPTIONS: TransactionOptions = {
  mongo: {
    readConcern: "local",
  },
};

export const ADM_ENTITIES_UNION_TARGET_COLUMN_NAME = "target";
