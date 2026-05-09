import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import { mapProvinceSnakeToCamel } from "@scope/helpers/models";
import { DbHelper } from "@scope/helpers";
import { BaseAdmPostgresTableDML } from "./adm-table.postgres.dml.ts";
import type {
  DbTransactionContext,
  DMLCreateManyResult,
  DMLUpdateResult,
  EntityId,
  ProvinceTableDML,
} from "@scope/types/db";
import type {
  MadaAdmConfigValues,
  Province,
  ProvinceRecord,
  ProvinceSnakeCased,
} from "@scope/types/models";
import type { PostgresDbConnection } from "../postgres-db.connection.ts";

/**
 * PostgreSQL DML implementation for the provinces table.
 */
export class ProvincesPostgresDML extends BaseAdmPostgresTableDML
  implements ProvinceTableDML {
  constructor(
    config: MadaAdmConfigValues,
    db: PostgresDbConnection,
    schema?: string,
  ) {
    super(config, db, AdmLevelCode.PROVINCE, schema);
  }

  /**
   * Retrieves multiple provinces by their names.
   *
   * @param names - The province names to look up (case-insensitive).
   * @param transactionContext - Optional database transaction context.
   * @returns An array of matching province entities.
   */
  async getManyByNames(
    names: string[],
    transactionContext?: DbTransactionContext,
  ): Promise<Province[]> {
    const tableName = this.getTableName(
      ADM_LEVEL_TITLE_BY_CODE.get(AdmLevelCode.PROVINCE)! + "s",
    );
    const query = `SELECT * FROM ${tableName} WHERE province = ANY($1)`;
    const isTx = DbHelper.ensureIsPostgresDbTransactionCtx(transactionContext);
    const client = isTx ? null : await this.db.pool.connect();
    const executor = isTx ? transactionContext.tx : client!;
    try {
      const result = await executor.queryObject<ProvinceSnakeCased>(query, [
        names,
      ]);
      return result.rows.map(mapProvinceSnakeToCamel);
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Updates a field of all province records whose IDs belong to the provided set.
   *
   * @param ids - The province IDs to target.
   * @param fieldCode - The ADM level field to update.
   * @param value - The new value to assign.
   * @param transactionContext - Optional database transaction context.
   * @returns An object containing the number of affected rows.
   */
  async updateFieldByIds(
    ids: EntityId[],
    fieldCode: AdmLevelCode.PROVINCE,
    value: string,
    transactionContext?: DbTransactionContext,
  ): Promise<DMLUpdateResult> {
    const column = ADM_LEVEL_TITLE_BY_CODE.get(fieldCode)!;
    return await this._updateFieldByIds(ids, column, value, transactionContext);
  }

  /**
   * Inserts multiple province records into the database in a single transaction.
   *
   * @param values - An array of province values to insert.
   * @returns A result object containing the count of inserted rows.
   */
  async createMany(
    values: ProvinceRecord[],
    transactionContext?: DbTransactionContext,
  ): Promise<DMLCreateManyResult> {
    return await this._createMany(values, transactionContext);
  }

  /**
   * Removes duplicate province records from the table.
   */
  async deleteDuplicates(
    transactionContext?: DbTransactionContext,
  ): Promise<void> {
    await this._deleteDuplicates(transactionContext);
  }

  /**
   * Updates the geojson field of a province record identified by name.
   *
   * @param name - The name of the province.
   * @param geojson - The GeoJSON string value to assign.
   * @param transactionContext - Optional database transaction context.
   * @returns An object containing the number of affected rows.
   */
  async updateGeojsonByName(
    name: string,
    geojson: string,
    transactionContext?: DbTransactionContext,
  ): Promise<DMLUpdateResult> {
    return await this._updateGeojsonByIdentifiers(
      { province: name },
      geojson,
      transactionContext,
    );
  }
}

let _instance: ProvincesPostgresDML | null = null;

/**
 * Injector for the ProvincesPostgresDML singleton.
 *
 * @param config - The runtime ADM configuration.
 * @param db - The singleton PostgreSQL database connection.
 * @param schema - The ADM schema binding.
 * @returns The singleton instance of ProvincesPostgresDML.
 */
export function injectProvincesPostgresDML(
  config: MadaAdmConfigValues,
  db: PostgresDbConnection,
  schema: string = "public",
): ProvincesPostgresDML {
  if (!_instance) {
    _instance = new ProvincesPostgresDML(config, db, schema);
  }
  return _instance;
}
