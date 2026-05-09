import { MADA_ADM_CONFIGS_TABLE_NAME_SNAKE_CASED } from "@scope/consts/db";
import type { MadaAdmConfigDML } from "@scope/types/db";
import type {
  MadaAdmConfig,
  MadaAdmConfigSnakeCased,
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { MySQLDbConnection } from "../mysql-db.connection.ts";
import { ensureIsMySQLDbTransactionCtx } from "@scope/helpers/db";

/**
 * Concrete implementation of the MadaAdmConfigDML interface using MySQL.
 */
export class MadaAdmConfigMySQLDML implements MadaAdmConfigDML {
  constructor(protected db: MySQLDbConnection) {}

  private _mapRowToConfig(row: MadaAdmConfigSnakeCased): MadaAdmConfig {
    return {
      id: row.id,
      createdAt: row.created_at?.toString(),
      updatedAt: row.updated_at?.toString(),
      tablesPrefix: row.tables_prefix,
      isFkRepeated: !!row.is_fk_repeated,
      isProvinceRepeated: !!row.is_province_repeated,
      isProvinceFkRepeated: !!row.is_province_fk_repeated,
      hasGeojson: !!row.has_geojson,
      hasAdmLevel: !!row.has_adm_level,
    };
  }

  /**
   * Retrieves the first MadaAdmConfig record from the database.
   */
  async get(): Promise<MadaAdmConfig | null> {
    const query =
      `SELECT * FROM ${MADA_ADM_CONFIGS_TABLE_NAME_SNAKE_CASED} LIMIT 1;`;
    const [rows] = (await this.db.pool.query(query)) as unknown as [
      MadaAdmConfigSnakeCased[],
      unknown,
    ];
    const row = rows[0];

    if (!row) {
      return null;
    }

    return this._mapRowToConfig(row);
  }

  /**
   * Inserts or updates the MadaAdmConfig record in the database.
   */
  async createOrUpdate(values: MadaAdmConfigValues): Promise<MadaAdmConfig> {
    return await this.db.transaction(async (transactionContext) => {
      if (!ensureIsMySQLDbTransactionCtx(transactionContext)) {
        throw new Error("This method can only be called within a transaction.");
      }
      const connection = transactionContext.connection;
      const checkQuery =
        `SELECT id FROM ${MADA_ADM_CONFIGS_TABLE_NAME_SNAKE_CASED} LIMIT 1;`;
      const [rows] = (await connection.query(checkQuery)) as unknown as [
        { id: number }[],
        unknown,
      ];
      const existingRow = rows[0];

      if (existingRow) {
        const updateQuery = `
          UPDATE ${MADA_ADM_CONFIGS_TABLE_NAME_SNAKE_CASED}
          SET
            tables_prefix = ?,
            is_fk_repeated = ?,
            is_province_repeated = ?,
            is_province_fk_repeated = ?,
            has_geojson = ?,
            has_adm_level = ?
          WHERE id = ?;
        `;
        await connection.query(updateQuery, [
          values.tablesPrefix,
          values.isFkRepeated,
          values.isProvinceRepeated,
          values.isProvinceFkRepeated,
          values.hasGeojson,
          values.hasAdmLevel,
          existingRow.id,
        ]);

        const selectQuery =
          `SELECT * FROM ${MADA_ADM_CONFIGS_TABLE_NAME_SNAKE_CASED} WHERE id = ?;`;
        const [updatedRows] = (await connection.query(selectQuery, [
          existingRow.id,
        ])) as unknown as [MadaAdmConfigSnakeCased[], unknown];
        return this._mapRowToConfig(updatedRows[0]);
      } else {
        const insertQuery = `
          INSERT INTO ${MADA_ADM_CONFIGS_TABLE_NAME_SNAKE_CASED} (
            tables_prefix,
            is_fk_repeated,
            is_province_repeated,
            is_province_fk_repeated,
            has_geojson,
            has_adm_level
          )
          VALUES (?, ?, ?, ?, ?, ?);
        `;
        const [result] = (await connection.query(insertQuery, [
          values.tablesPrefix,
          values.isFkRepeated,
          values.isProvinceRepeated,
          values.isProvinceFkRepeated,
          values.hasGeojson,
          values.hasAdmLevel,
        ])) as unknown as [{ insertId: number }, unknown];

        const selectQuery =
          `SELECT * FROM ${MADA_ADM_CONFIGS_TABLE_NAME_SNAKE_CASED} WHERE id = ?;`;
        const [insertedRows] = (await connection.query(selectQuery, [
          result.insertId,
        ])) as unknown as [MadaAdmConfigSnakeCased[], unknown];
        return this._mapRowToConfig(insertedRows[0]);
      }
    });
  }
}

let _instance: MadaAdmConfigMySQLDML | null = null;

/**
 * Injects (or creates) an instance of {@link MadaAdmConfigMySQLDML}.
 *
 * @param db - The MySQL database connection instance.
 * @returns The instance of the mada adm config DML.
 */
export function injectMadaAdmConfigMySQLDML(
  db: MySQLDbConnection,
): MadaAdmConfigMySQLDML {
  if (!_instance) _instance = new MadaAdmConfigMySQLDML(db);
  return _instance;
}

export function resetMadaAdmConfigMySQLDML(): void {
  _instance = null;
}
