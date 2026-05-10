import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import { BaseAdmTableDDL } from "@scope/db/ddl/base";
import { DbHelper } from "@scope/helpers";
import type { DbTransactionContext } from "@scope/types/db";
import type { MadaAdmConfigValues } from "@scope/types/models";

import type { PostgresDbConnection } from "../postgres-db.connection.ts";

/**
 * Concrete implementation of the DDL abstract class for the regions table
 * using PostgreSQL.
 */
export class RegionsPostgresDDL extends BaseAdmTableDDL {
  constructor(
    protected db: PostgresDbConnection,
    config: MadaAdmConfigValues,
    schema: string = "public",
  ) {
    super(config, schema);
  }

  get tableName(): string {
    return this.getTableName(
      ADM_LEVEL_TITLE_BY_CODE.get(AdmLevelCode.REGION)! + "s",
    );
  }

  async create(transactionContext?: DbTransactionContext): Promise<void> {
    const geometryColumn = this.config.hasGeojson
      ? "\n        geojson GEOMETRY(Geometry, 4326) NOT NULL,"
      : "";
    const admLevelColumn = this.config.hasAdmLevel
      ? "\n        adm_level SMALLINT NOT NULL DEFAULT 1,"
      : "";
    const provincesTable = this.getTableName(
      ADM_LEVEL_TITLE_BY_CODE.get(AdmLevelCode.PROVINCE)! + "s",
    );

    const query = `
      CREATE TABLE IF NOT EXISTS ${this.schema}.${this.tableName} (
        id SERIAL PRIMARY KEY,
        region CITEXT NOT NULL,
        province CITEXT NOT NULL,
        province_id INTEGER NOT NULL,${admLevelColumn}${geometryColumn}
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_region_province FOREIGN KEY (province_id) REFERENCES ${this.schema}.${provincesTable}(id) ON DELETE CASCADE
      );
    `;
    const indexesQuery = `
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_region_ci 
      ON ${this.schema}.${this.tableName} (region citext_ops);
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_province_id 
      ON ${this.schema}.${this.tableName} (province_id);
    `;

    const isTx = DbHelper.ensureIsPostgresDbTransactionCtx(transactionContext);
    const client = isTx ? null : await this.db.pool.connect();
    const executor = isTx ? transactionContext.tx : client!;
    try {
      await executor.queryObject(query);
      await executor.queryObject(indexesQuery);
    } finally {
      if (client) client.release();
    }
  }

  async drop(transactionContext?: DbTransactionContext): Promise<void> {
    const query = `DROP TABLE IF EXISTS ${this.schema}.${this.tableName};`;
    const isTx = DbHelper.ensureIsPostgresDbTransactionCtx(transactionContext);
    const client = isTx ? null : await this.db.pool.connect();
    const executor = isTx ? transactionContext.tx : client!;
    try {
      await executor.queryObject(query);
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Checks if the regions physical table exists in the PostgreSQL database.
   *
   * @returns A promise that resolves to true if the table exists, false otherwise.
   */
  async exists(transactionContext?: DbTransactionContext): Promise<boolean> {
    const query = `
      SELECT EXISTS (
         SELECT FROM pg_tables
         WHERE  schemaname = '${this.schema}'
         AND    tablename  = '${this.tableName}'
      );
    `;
    const isTx = DbHelper.ensureIsPostgresDbTransactionCtx(transactionContext);
    const client = isTx ? null : await this.db.pool.connect();
    const executor = isTx ? transactionContext.tx : client!;
    try {
      const result = await executor.queryObject<{ exists: boolean }>(query);
      return result.rows[0]?.exists ?? false;
    } finally {
      if (client) client.release();
    }
  }
}

let _instance: RegionsPostgresDDL | null = null;

/**
 * Injects (or creates) an instance of {@link RegionsPostgresDDL}.
 *
 * @param config - The runtime ADM configuration.
 * @param db - The PostgreSQL database connection.
 * @param schema - The ADM schema binding.
 */
export function injectRegionsPostgresDDL(
  config: MadaAdmConfigValues,
  db: PostgresDbConnection,
  schema: string = "public",
): RegionsPostgresDDL {
  if (!_instance) _instance = new RegionsPostgresDDL(db, config, schema);
  return _instance;
}

/**
 * Resets the singleton instance of the regions table DDL.
 */
export function resetRegionsPostgresDDL(): void {
  _instance = null;
}
