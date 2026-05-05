import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";

import { BaseAdmPostgresTableDML } from "./adm-table.postgres.dml.ts";
import type {
  DbTransactionContext,
  DistrictAttributes,
  DistrictTableDML,
  DMLCreateManyResult,
  DMLUpdateResult,
  EntityId,
} from "@scope/types/db";
import type {
  District,
  DistrictRecord,
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { PostgresDbConnection } from "../postgres-db.connection.ts";

/**
 * PostgreSQL DML implementation for the districts table.
 */
export class DistrictsPostgresDML extends BaseAdmPostgresTableDML
  implements DistrictTableDML {
  constructor(
    config: MadaAdmConfigValues,
    db: PostgresDbConnection,
    schema: string = "public",
  ) {
    super(config, db, schema);
  }

  /**
   * Retrieves multiple districts by their unique attributes.
   *
   * @param attributes - The list of district identifying attributes.
   * @param transactionContext - Optional database transaction context.
   * @returns An array of matching district entities.
   */
  async getManyByAttributes(
    attributes: DistrictAttributes[],
    transactionContext?: DbTransactionContext,
  ): Promise<District[]> {
    return (await this._getManyByAttributes(
      AdmLevelCode.DISTRICT,
      attributes,
      transactionContext,
    )) as District[];
  }

  /**
   * Retrieves multiple districts whose nearest parent region ID is among the provided set.
   *
   * @param regionIds - The region IDs to filter by.
   * @param transactionContext - Optional database transaction context.
   * @returns An array of matching district entities.
   */
  async getManyByRegionIds(
    regionIds: EntityId[],
    transactionContext?: DbTransactionContext,
  ): Promise<District[]> {
    return (await this._getManyByParentsIds(
      AdmLevelCode.DISTRICT,
      regionIds,
      transactionContext,
    )) as District[];
  }

  /**
   * Updates a field of all district records whose IDs belong to the provided set.
   *
   * @param ids - The district IDs to target.
   * @param fieldCode - The ADM level field to update.
   * @param value - The new value to assign.
   * @param transactionContext - Optional database transaction context.
   * @returns An object containing the number of affected rows.
   */
  async updateFieldByIds(
    ids: EntityId[],
    fieldCode:
      | AdmLevelCode.DISTRICT
      | AdmLevelCode.REGION
      | AdmLevelCode.PROVINCE,
    value: string,
    transactionContext?: DbTransactionContext,
  ): Promise<DMLUpdateResult> {
    const column = ADM_LEVEL_TITLE_BY_CODE.get(fieldCode)!;
    return await this._updateFieldByIds(
      AdmLevelCode.DISTRICT,
      ids,
      column,
      value,
      transactionContext,
    );
  }

  /**
   * Inserts multiple district records into the database in a single transaction.
   *
   * @param values - An array of district values to insert.
   * @returns A result object containing the count of inserted rows.
   */
  async createMany(
    values: DistrictRecord[],
    transactionContext?: DbTransactionContext,
  ): Promise<DMLCreateManyResult> {
    return await this._createMany(
      AdmLevelCode.DISTRICT,
      values,
      transactionContext,
    );
  }

  /**
   * Removes duplicate district records from the table.
   */
  async deleteDuplicates(
    transactionContext?: DbTransactionContext,
  ): Promise<void> {
    await this._deleteDuplicates(AdmLevelCode.DISTRICT, transactionContext);
  }

  /**
   * Updates the geojson field of a district record identified by its attributes.
   *
   * @param attributes - The identifying attributes for the district.
   * @param geojson - The GeoJSON string value to assign.
   * @param transactionContext - Optional database transaction context.
   * @returns An object containing the number of affected rows.
   */
  async updateGeojsonByAttributes(
    attributes: DistrictAttributes,
    geojson: string,
    transactionContext?: DbTransactionContext,
  ): Promise<DMLUpdateResult> {
    return await this._updateGeojsonByIdentifiers(
      AdmLevelCode.DISTRICT,
      { district: attributes.district, region: attributes.region },
      geojson,
      transactionContext,
    );
  }
}

let _instance: DistrictsPostgresDML | null = null;

/**
 * Injector for the DistrictsPostgresDML singleton.
 *
 * @param config - The runtime ADM configuration.
 * @param db - The singleton PostgreSQL database connection.
 * @param schema - The ADM schema binding.
 * @returns The singleton instance of DistrictsPostgresDML.
 */
export function injectDistrictsPostgresDML(
  config: MadaAdmConfigValues,
  db: PostgresDbConnection,
  schema: string = "public",
): DistrictsPostgresDML {
  if (!_instance) {
    _instance = new DistrictsPostgresDML(config, db, schema);
  }
  return _instance;
}
