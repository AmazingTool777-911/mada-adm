import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import { BaseAdmCollectionMongoDML } from "./adm-collection.mongo.dml.ts";
import type {
  CommuneTableDML,
  DbTransactionContext,
  DMLCreateManyResult,
  DMLUpdateResult,
  EntityId,
} from "@scope/types/db";
import type {
  Commune,
  CommuneAttributes,
  CommuneRecord,
  MadaAdmConfig,
} from "@scope/types/models";
import type { MongoDbConnection } from "../mongo-db.connection.ts";

/**
 * MongoDB DML implementation for the communes collection.
 */
export class CommunesMongoDML extends BaseAdmCollectionMongoDML
  implements CommuneTableDML {
  constructor(config: MadaAdmConfig, db: MongoDbConnection) {
    super(db, config, AdmLevelCode.COMMUNE);
  }

  /**
   * Retrieves multiple communes by their unique attributes.
   *
   * @param attributes - The list of commune identifying attributes.
   * @param transactionContext - Optional database transaction context.
   * @returns An array of matching commune entities.
   */
  async getManyByAttributes(
    attributes: CommuneAttributes[],
    transactionContext?: DbTransactionContext,
  ): Promise<Commune[]> {
    return (await this._getManyByAttributes(
      attributes,
      transactionContext,
    )) as Commune[];
  }

  /**
   * Retrieves multiple communes whose nearest parent district ID is among the provided set.
   *
   * @param districtIds - The district IDs to filter by.
   * @param transactionContext - Optional database transaction context.
   * @returns An array of matching commune entities.
   */
  async getManyByDistrictIds(
    districtIds: EntityId[],
    transactionContext?: DbTransactionContext,
  ): Promise<Commune[]> {
    return (await this._getManyByParentsIds(
      districtIds,
      transactionContext,
    )) as Commune[];
  }

  /**
   * Updates a field of all commune records whose IDs belong to the provided set.
   *
   * @param ids - The commune IDs to target.
   * @param fieldCode - The ADM level field to update.
   * @param value - The new value to assign.
   * @param transactionContext - Optional database transaction context.
   * @returns An object containing the number of affected rows.
   */
  async updateFieldByIds(
    ids: EntityId[],
    fieldCode:
      | AdmLevelCode.COMMUNE
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
   * Inserts multiple commune records into the collection.
   *
   * @param values - An array of commune values to insert.
   * @param transactionContext - Optional database transaction context.
   * @returns A result object containing the count of inserted rows.
   */
  async createMany(
    values: CommuneRecord[],
    transactionContext?: DbTransactionContext,
  ): Promise<DMLCreateManyResult> {
    return await this._createMany(values, transactionContext);
  }

  /**
   * Removes duplicate commune records from the collection.
   *
   * @param transactionContext - Database transaction context.
   */
  async deleteDuplicates(
    transactionContext?: DbTransactionContext,
  ): Promise<void> {
    await this._deleteDuplicates(transactionContext);
  }

  /**
   * Updates the geojson field of a commune record identified by its attributes.
   *
   * @param attributes - The identifying attributes for the commune.
   * @param geojson - The GeoJSON string value to assign.
   * @param transactionContext - Optional database transaction context.
   * @returns An object containing the number of affected rows.
   */
  async updateGeojsonByAttributes(
    attributes: CommuneAttributes,
    geojson: string,
    transactionContext?: DbTransactionContext,
  ): Promise<DMLUpdateResult> {
    return await this._updateGeojsonByIdentifiers(
      {
        commune: attributes.commune,
        district: attributes.district,
        region: attributes.region,
      },
      geojson,
      transactionContext,
    );
  }
}

let _instance: CommunesMongoDML | null = null;

/**
 * Injects (or creates) an instance of {@link CommunesMongoDML}.
 *
 * @param config - The runtime ADM configuration.
 * @param db - The MongoDB database connection.
 * @returns The singleton instance of CommunesMongoDML.
 */
export function injectCommunesMongoDML(
  config: MadaAdmConfig,
  db: MongoDbConnection,
): CommunesMongoDML {
  if (!_instance) _instance = new CommunesMongoDML(config, db);
  return _instance;
}

/**
 * Resets the singleton instance of the communes MongoDB DML.
 */
export function resetCommunesMongoDML(): void {
  _instance = null;
}
