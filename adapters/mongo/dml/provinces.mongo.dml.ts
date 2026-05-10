import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import type {
  DbTransactionContext,
  DMLCreateManyResult,
  DMLUpdateResult,
  EntityId,
  ProvinceTableDML,
} from "@scope/types/db";
import type {
  MadaAdmConfig,
  Province,
  ProvinceRecord,
} from "@scope/types/models";

import type { MongoDbConnection } from "../mongo-db.connection.ts";
import { BaseAdmCollectionMongoDML } from "./adm-collection.mongo.dml.ts";

/**
 * MongoDB DML implementation for the provinces collection.
 */
export class ProvincesMongoDML extends BaseAdmCollectionMongoDML
  implements ProvinceTableDML {
  constructor(config: MadaAdmConfig, db: MongoDbConnection) {
    super(db, config, AdmLevelCode.PROVINCE);
  }

  /**
   * Retrieves multiple provinces by their names.
   *
   * @param names - The province names to look up.
   * @param transactionContext - Optional database transaction context.
   * @returns An array of matching province entities.
   */
  async getManyByNames(
    names: string[],
    transactionContext?: DbTransactionContext,
  ): Promise<Province[]> {
    return (await this._getManyByAttributes(
      names.map((name) => ({ province: name })),
      transactionContext,
    )) as Province[];
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
   * Inserts multiple province records into the collection.
   *
   * @param values - An array of province values to insert.
   * @param transactionContext - Optional database transaction context.
   * @returns A result object containing the count of inserted rows.
   */
  async createMany(
    values: ProvinceRecord[],
    transactionContext?: DbTransactionContext,
  ): Promise<DMLCreateManyResult> {
    return await this._createMany(values, transactionContext);
  }

  /**
   * Removes duplicate province records from the collection.
   *
   * @param transactionContext - Database transaction context.
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

let _instance: ProvincesMongoDML | null = null;

/**
 * Injects (or creates) an instance of {@link ProvincesMongoDML}.
 *
 * @param config - The runtime ADM configuration.
 * @param db - The MongoDB database connection.
 * @returns The singleton instance of ProvincesMongoDML.
 */
export function injectProvincesMongoDML(
  config: MadaAdmConfig,
  db: MongoDbConnection,
): ProvincesMongoDML {
  if (!_instance) _instance = new ProvincesMongoDML(config, db);
  return _instance;
}

/**
 * Resets the singleton instance of the provinces MongoDB DML.
 */
export function resetProvincesMongoDML(): void {
  _instance = null;
}
