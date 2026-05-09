import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import { BaseAdmTableDDL } from "@scope/db/ddl/base";
import type { MadaAdmConfigValues } from "@scope/types/models";
import type { DbTransactionContext } from "@scope/types/db";
import type { MySQLDbConnection } from "../mysql-db.connection.ts";
import { ensureIsMySQLDbTransactionCtx } from "@scope/helpers/db";
import { MYSQL_TEXT_COLUMN_COLLATION } from "@scope/consts/db";

/**
 * Concrete implementation of the DDL abstract class for the communes table
 * using MySQL.
 */
export class CommunesMySQLDDL extends BaseAdmTableDDL {
  constructor(
    protected db: MySQLDbConnection,
    config: MadaAdmConfigValues,
  ) {
    super(config);
  }

  get tableName(): string {
    return this.getTableName(
      ADM_LEVEL_TITLE_BY_CODE.get(AdmLevelCode.COMMUNE)! + "s",
    );
  }

  async create(transactionContext?: DbTransactionContext): Promise<void> {
    const geometryColumn = this.config.hasGeojson
      ? "\n        geojson GEOMETRY NOT NULL,"
      : "";
    const admLevelColumn = this.config.hasAdmLevel
      ? "\n        adm_level SMALLINT NOT NULL DEFAULT 3,"
      : "";

    const districtsTable = this.getTableName(
      ADM_LEVEL_TITLE_BY_CODE.get(AdmLevelCode.DISTRICT)! + "s",
    );
    const regionsTable = this.getTableName(
      ADM_LEVEL_TITLE_BY_CODE.get(AdmLevelCode.REGION)! + "s",
    );
    const provincesTable = this.getTableName(
      ADM_LEVEL_TITLE_BY_CODE.get(AdmLevelCode.PROVINCE)! + "s",
    );

    let optionalCols = "";
    let optionalFk = "";

    if (this.config.isProvinceRepeated) {
      optionalCols += "\n        province VARCHAR(255) NOT NULL,";
    }
    if (this.config.isProvinceFkRepeated) {
      optionalCols += "\n        province_id INT NOT NULL,";
      optionalFk +=
        `,\n        CONSTRAINT fk_${this.tableName}_province FOREIGN KEY (province_id) REFERENCES ${provincesTable}(id) ON DELETE CASCADE`;
    }
    if (this.config.isFkRepeated) {
      optionalCols += "\n        region_id INT NOT NULL,";
      optionalFk +=
        `,\n        CONSTRAINT fk_${this.tableName}_region FOREIGN KEY (region_id) REFERENCES ${regionsTable}(id) ON DELETE CASCADE`;
    }

    const query = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        commune VARCHAR(255) NOT NULL,
        district VARCHAR(255) NOT NULL,
        region VARCHAR(255) NOT NULL,
        district_id INT NOT NULL,${optionalCols}${admLevelColumn}${geometryColumn}
        created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_${this.tableName}_commune (commune),
        INDEX idx_${this.tableName}_district_id_main (district_id),
        CONSTRAINT fk_${this.tableName}_district_main FOREIGN KEY (district_id) REFERENCES ${districtsTable}(id) ON DELETE CASCADE
        ${optionalFk ? optionalFk : ""}
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=${MYSQL_TEXT_COLUMN_COLLATION};
    `;
    const client = ensureIsMySQLDbTransactionCtx(transactionContext)
      ? transactionContext.connection
      : this.db.pool;
    await client.query(query);

    if (this.config.hasGeojson) {
      try {
        await client.query(
          `ALTER TABLE ${this.tableName} ADD SPATIAL INDEX idx_${this.tableName}_geojson (geojson);`,
        );
      } catch (_e) {
        // Silently ignore if index already exists
      }
    }

    if (this.config.isProvinceFkRepeated) {
      try {
        await client.query(
          `ALTER TABLE ${this.tableName} ADD INDEX idx_${this.tableName}_province_id (province_id);`,
        );
      } catch (_e) {
        // Silently ignore if index already exists
      }
    }
    if (this.config.isFkRepeated) {
      try {
        await client.query(
          `ALTER TABLE ${this.tableName} ADD INDEX idx_${this.tableName}_region_id (region_id);`,
        );
      } catch (_e) {
        // Silently ignore if index already exists
      }
    }
  }

  async drop(transactionContext?: DbTransactionContext): Promise<void> {
    const query = `DROP TABLE IF EXISTS ${this.tableName};`;
    const client = ensureIsMySQLDbTransactionCtx(transactionContext)
      ? transactionContext.connection
      : this.db.pool;
    await client.query(query);
  }

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

let _instance: CommunesMySQLDDL | null = null;

export function injectCommunesMySQLDDL(
  config: MadaAdmConfigValues,
  db: MySQLDbConnection,
): CommunesMySQLDDL {
  if (!_instance) _instance = new CommunesMySQLDDL(db, config);
  return _instance;
}

export function resetCommunesMySQLDDL(): void {
  _instance = null;
}
