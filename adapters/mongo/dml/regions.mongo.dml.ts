import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import type {
  DbTransactionContext,
  DMLCreateManyResult,
  DMLUpdateResult,
  EntityId,
  RegionTableDML,
} from "@scope/types/db";
import type { MadaAdmConfig, Region, RegionRecord } from "@scope/types/models";

import type { MongoDbConnection } from "../mongo-db.connection.ts";
import { BaseAdmCollectionMongoDML } from "./adm-collection.mongo.dml.ts";

/**
 * MongoDB DML implementation for the regions collection.
 */
export class RegionsMongoDML extends BaseAdmCollectionMongoDML
  implements RegionTableDML {
  constructor(config: MadaAdmConfig, db: MongoDbConnection) {
    super(db, config, AdmLevelCode.REGION);
  }

  /**
   * Retrieves multiple regions by their names.
   *
   * @param names - The region names to look up.
   * @param transactionContext - Optional database transaction context.
   * @returns An array of matching region entities.
   */
  async getManyByNames(
    names: string[],
    transactionContext?: DbTransactionContext,
  ): Promise<Region[]> {
    return (await this._getManyByAttributes(
      names.map((name) => ({ region: name })),
      transactionContext,
    )) as Region[];
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
    return await this._updateFieldByIds(ids, column, value, transactionContext);
  }

  /**
   * Inserts multiple region records into the collection.
   *
   * @param values - An array of region values to insert.
   * @param transactionContext - Optional database transaction context.
   * @returns A result object containing the count of inserted rows.
   */
  async createMany(
    values: RegionRecord[],
    transactionContext?: DbTransactionContext,
  ): Promise<DMLCreateManyResult> {
    return await this._createMany(values, transactionContext);
  }

  /**
   * Removes duplicate region records from the collection.
   *
   * @param transactionContext - Database transaction context.
   */
  async deleteDuplicates(
    transactionContext?: DbTransactionContext,
  ): Promise<void> {
    await this._deleteDuplicates(transactionContext);
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
      { region: name },
      geojson,
      transactionContext,
    );
  }
}

let _instance: RegionsMongoDML | null = null;

/**
 * Injects (or creates) an instance of {@link RegionsMongoDML}.
 *
 * @param config - The runtime ADM configuration.
 * @param db - The MongoDB database connection.
 * @returns The singleton instance of RegionsMongoDML.
 */
export function injectRegionsMongoDML(
  config: MadaAdmConfig,
  db: MongoDbConnection,
): RegionsMongoDML {
  if (!_instance) _instance = new RegionsMongoDML(config, db);
  return _instance;
}

/**
 * Resets the singleton instance of the regions MongoDB DML.
 */
export function resetRegionsMongoDML(): void {
  _instance = null;
}
