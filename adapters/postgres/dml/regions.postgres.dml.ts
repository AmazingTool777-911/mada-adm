import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import { mapRegionSnakeToCamel } from "@scope/helpers/models";
import { DbHelper } from "@scope/helpers";
import { BaseAdmPostgresTableDML } from "./adm-table.postgres.dml.ts";
import type {
  DbTransactionContext,
  DMLCreateManyResult,
  DMLUpdateResult,
  EntityId,
  RegionTableDML,
} from "@scope/types/db";
import type {
  MadaAdmConfigValues,
  Region,
  RegionRecord,
  RegionSnakeCased,
} from "@scope/types/models";
import type { PostgresDbConnection } from "../postgres-db.connection.ts";

/**
 * PostgreSQL DML implementation for the regions table.
 */
export class RegionsPostgresDML extends BaseAdmPostgresTableDML
  implements RegionTableDML {
  constructor(
    config: MadaAdmConfigValues,
    db: PostgresDbConnection,
    schema: string = "public",
  ) {
    super(config, db, schema);
  }

  /**
   * Retrieves multiple regions by their names.
   *
   * @param names - The region names to look up (case-insensitive).
   * @param transactionContext - Optional database transaction context.
   * @returns An array of matching region entities.
   */
  async getManyByNames(
    names: string[],
    transactionContext?: DbTransactionContext,
  ): Promise<Region[]> {
    const tableName = this.getTableName(
      ADM_LEVEL_TITLE_BY_CODE.get(AdmLevelCode.REGION)! + "s",
    );
    const query = `SELECT * FROM ${tableName} WHERE region = ANY($1)`;
    const isTx = DbHelper.ensureIsPostgresDbTransactionCtx(transactionContext);
    const client = isTx ? null : await this.db.pool.connect();
    const executor = isTx ? transactionContext.tx : client!;
    try {
      const result = await executor.queryObject<RegionSnakeCased>(query, [
        names,
      ]);
      return result.rows.map(mapRegionSnakeToCamel);
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Retrieves multiple regions whose nearest parent province ID is among the provided set.
   *
   * @param provinceIds - The province IDs to filter by.
   * @param transactionContext - Optional database transaction context.
   * @returns An array of matching region entities.
   */
  async getManyByProvinceIds(
    provinceIds: EntityId[],
    transactionContext?: DbTransactionContext,
  ): Promise<Region[]> {
    return (await this._getManyByParentsIds(
      AdmLevelCode.REGION,
      provinceIds,
      transactionContext,
    )) as Region[];
  }

  /**
   * Updates a field of all region records whose IDs belong to the provided set.
   *
   * @param ids - The region IDs to target.
   * @param fieldCode - The ADM level field to update.
   * @param value - The new value to assign.
   * @param transactionContext - Optional database transaction context.
   * @returns An object containing the number of affected rows.
   */
  async updateFieldByIds(
    ids: EntityId[],
    fieldCode: AdmLevelCode.REGION | AdmLevelCode.PROVINCE,
    value: string,
    transactionContext?: DbTransactionContext,
  ): Promise<DMLUpdateResult> {
    const column = ADM_LEVEL_TITLE_BY_CODE.get(fieldCode)!;
    return await this._updateFieldByIds(
      AdmLevelCode.REGION,
      ids,
      column,
      value,
      transactionContext,
    );
  }

  /**
   * Inserts multiple region records into the database in a single transaction.
   *
   * @param values - An array of region values to insert.
   * @returns A result object containing the count of inserted rows.
   */
  async createMany(
    values: RegionRecord[],
    transactionContext?: DbTransactionContext,
  ): Promise<DMLCreateManyResult> {
    return await this._createMany(
      AdmLevelCode.REGION,
      values,
      transactionContext,
    );
  }

  /**
   * Removes duplicate region records from the table.
   */
  async deleteDuplicates(
    transactionContext?: DbTransactionContext,
  ): Promise<void> {
    await this._deleteDuplicates(AdmLevelCode.REGION, transactionContext);
  }

  /**
   * Updates the geojson field of a region record identified by name.
   *
   * @param name - The name of the region.
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
      AdmLevelCode.REGION,
      { region: name },
      geojson,
      transactionContext,
    );
  }
}

let _instance: RegionsPostgresDML | null = null;

/**
 * Injector for the RegionsPostgresDML singleton.
 *
 * @param config - The runtime ADM configuration.
 * @param db - The singleton PostgreSQL database connection.
 * @param schema - The ADM schema binding.
 * @returns The singleton instance of RegionsPostgresDML.
 */
export function injectRegionsPostgresDML(
  config: MadaAdmConfigValues,
  db: PostgresDbConnection,
  schema: string = "public",
): RegionsPostgresDML {
  if (!_instance) {
    _instance = new RegionsPostgresDML(config, db, schema);
  }
  return _instance;
}
