import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import { BaseAdmCollectionMongoDML } from "./adm-collection.mongo.dml.ts";
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
  MadaAdmConfig,
} from "@scope/types/models";
import type { MongoDbConnection } from "../mongo-db.connection.ts";

/**
 * MongoDB DML implementation for the districts collection.
 */
export class DistrictsMongoDML extends BaseAdmCollectionMongoDML
  implements DistrictTableDML {
  constructor(config: MadaAdmConfig, db: MongoDbConnection) {
    super(db, config, AdmLevelCode.DISTRICT);
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
    return await this._updateFieldByIds(ids, column, value, transactionContext);
  }

  /**
   * Inserts multiple district records into the collection.
   *
   * @param values - An array of district values to insert.
   * @param transactionContext - Optional database transaction context.
   * @returns A result object containing the count of inserted rows.
   */
  async createMany(
    values: DistrictRecord[],
    transactionContext?: DbTransactionContext,
  ): Promise<DMLCreateManyResult> {
    return await this._createMany(values, transactionContext);
  }

  /**
   * Removes duplicate district records from the collection.
   *
   * @param transactionContext - Database transaction context.
   */
  async deleteDuplicates(
    transactionContext?: DbTransactionContext,
  ): Promise<void> {
    await this._deleteDuplicates(transactionContext);
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
      { district: attributes.district, region: attributes.region },
      geojson,
      transactionContext,
    );
  }
}

let _instance: DistrictsMongoDML | null = null;

/**
 * Injects (or creates) an instance of {@link DistrictsMongoDML}.
 *
 * @param config - The runtime ADM configuration.
 * @param db - The MongoDB database connection.
 * @returns The singleton instance of DistrictsMongoDML.
 */
export function injectDistrictsMongoDML(
  config: MadaAdmConfig,
  db: MongoDbConnection,
): DistrictsMongoDML {
  if (!_instance) _instance = new DistrictsMongoDML(config, db);
  return _instance;
}

/**
 * Resets the singleton instance of the districts MongoDB DML.
 */
export function resetDistrictsMongoDML(): void {
  _instance = null;
}
