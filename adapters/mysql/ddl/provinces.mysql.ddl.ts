import { MYSQL_TEXT_COLUMN_COLLATION } from "@scope/consts/db";
import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import { BaseAdmTableDDL } from "@scope/db/ddl/base";
import { ensureIsMySQLDbTransactionCtx } from "@scope/helpers/db";
import type { DbTransactionContext } from "@scope/types/db";
import type { MadaAdmConfigValues } from "@scope/types/models";

import type { MySQLDbConnection } from "../mysql-db.connection.ts";

/**
 * Concrete implementation of the DDL abstract class for the provinces table
 * using MySQL. It leverages the provided ADM configuration to dynamically
 * handle table naming and optional features like geojson.
 */
export class ProvincesMySQLDDL extends BaseAdmTableDDL {
  /**
   * Initializes a new instance of ProvincesMySQLDDL.
   *
   * @param db - The MySQL database connection.
   * @param config - The runtime ADM configuration to use for the table definitions.
   */
  constructor(
    protected db: MySQLDbConnection,
    config: MadaAdmConfigValues,
  ) {
    super(config);
  }

  /**
   * Generates the dynamic table name based on the configuration prefix.
   *
   * @returns The resolved table name.
   */
  get tableName(): string {
    return this.getTableName(
      ADM_LEVEL_TITLE_BY_CODE.get(AdmLevelCode.PROVINCE)! + "s",
    );
  }

  /**
   * Creates the provinces physical table in the MySQL database if it does not already exist.
   *
   * @returns A promise that resolves when the table creation is complete.
   */
  async create(transactionContext?: DbTransactionContext): Promise<void> {
    const geometryColumn = this.config.hasGeojson
      ? "\n        geojson GEOMETRY NOT NULL,"
      : "";
    const admLevelColumn = this.config.hasAdmLevel
      ? "\n        adm_level SMALLINT NOT NULL DEFAULT 0,"
      : "";

    const query = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        province VARCHAR(255) NOT NULL,${admLevelColumn}${geometryColumn}
        created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_${this.tableName}_province (province)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=${MYSQL_TEXT_COLUMN_COLLATION};
    `;
    const client = ensureIsMySQLDbTransactionCtx(transactionContext)
      ? transactionContext.connection
      : this.db.pool;
    await client.query(query);

    if (this.config.hasGeojson) {
      const spatialIndexQuery =
        `CREATE SPATIAL INDEX idx_${this.tableName}_geojson ON ${this.tableName} (geojson);`;
      try {
        await client.query(spatialIndexQuery);
      } catch (_e) {
        // Index already exists or spatial index not supported
      }
    }
  }

  /**
   * Drops the provinces physical table from the MySQL database if it exists.
   *
   * @returns A promise that resolves when the table drop is complete.
   */
  async drop(transactionContext?: DbTransactionContext): Promise<void> {
    const query = `DROP TABLE IF EXISTS ${this.tableName};`;
    const client = ensureIsMySQLDbTransactionCtx(transactionContext)
      ? transactionContext.connection
      : this.db.pool;
    await client.query(query);
  }

  /**
   * Checks if the provinces physical table exists in the MySQL database.
   *
   * @returns A promise that resolves to true if the table exists, false otherwise.
   */
  async exists(transactionContext?: DbTransactionContext): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = '${this.tableName}';
    `;
    const client = ensureIsMySQLDbTransactionCtx(transactionContext)
      ? transactionContext.connection
      : this.db.pool;
    const [rows] = (await client.query(query)) as unknown as [
      { count: number }[],
      unknown,
    ];
    return rows[0].count > 0;
  }
}

let _instance: ProvincesMySQLDDL | null = null;

/**
 * Injects (or creates) an instance of {@link ProvincesMySQLDDL}.
 *
 * @param config - The ADM configuration binding.
 * @param db - The MySQL database connection.
 * @returns The instance of the provinces table DDL.
 */
export function injectProvincesMySQLDDL(
  config: MadaAdmConfigValues,
  db: MySQLDbConnection,
): ProvincesMySQLDDL {
  if (!_instance) _instance = new ProvincesMySQLDDL(db, config);
  return _instance;
}

/**
 * Resets the singleton instance of the provinces table DDL.
 */
export function resetProvincesMySQLDDL(): void {
  _instance = null;
}
