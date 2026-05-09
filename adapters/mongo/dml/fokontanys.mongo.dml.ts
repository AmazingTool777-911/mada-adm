import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import { BaseAdmCollectionMongoDML } from "./adm-collection.mongo.dml.ts";
import type {
  DbTransactionContext,
  DMLCreateManyResult,
  DMLUpdateResult,
  EntityId,
  FokontanyAttributes,
  FokontanyTableDML,
} from "@scope/types/db";
import type {
  Fokontany,
  FokontanyRecord,
  MadaAdmConfig,
} from "@scope/types/models";
import type { MongoDbConnection } from "../mongo-db.connection.ts";

/**
 * MongoDB DML implementation for the fokontanys collection.
 */
export class FokontanysMongoDML extends BaseAdmCollectionMongoDML
  implements FokontanyTableDML {
  constructor(config: MadaAdmConfig, db: MongoDbConnection) {
    super(db, config, AdmLevelCode.FOKONTANY);
  }

  /**
   * Retrieves multiple fokontanys by their unique attributes.
   *
   * @param attributes - The list of fokontany identifying attributes.
   * @param transactionContext - Optional database transaction context.
   * @returns An array of matching fokontany entities.
   */
  async getManyByAttributes(
    attributes: FokontanyAttributes[],
    transactionContext?: DbTransactionContext,
  ): Promise<Fokontany[]> {
    return (await this._getManyByAttributes(
      attributes,
      transactionContext,
    )) as Fokontany[];
  }

  /**
   * Retrieves multiple fokontanys whose nearest parent commune ID is among the provided set.
   *
   * @param communeIds - The commune IDs to filter by.
   * @param transactionContext - Optional database transaction context.
   * @returns An array of matching fokontany entities.
   */
  async getManyByCommuneIds(
    communeIds: EntityId[],
    transactionContext?: DbTransactionContext,
  ): Promise<Fokontany[]> {
    return (await this._getManyByParentsIds(
      communeIds,
      transactionContext,
    )) as Fokontany[];
  }

  /**
   * Updates a field of all fokontany records whose IDs belong to the provided set.
   *
   * @param ids - The fokontany IDs to target.
   * @param fieldCode - The ADM level field to update.
   * @param value - The new value to assign.
   * @param transactionContext - Optional database transaction context.
   * @returns An object containing the number of affected rows.
   */
  async updateFieldByIds(
    ids: EntityId[],
    fieldCode:
      | AdmLevelCode.FOKONTANY
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
   * Inserts multiple fokontany records into the collection.
   *
   * @param values - An array of fokontany values to insert.
   * @param transactionContext - Optional database transaction context.
   * @returns A result object containing the count of inserted rows.
   */
  async createMany(
    values: FokontanyRecord[],
    transactionContext?: DbTransactionContext,
  ): Promise<DMLCreateManyResult> {
    return await this._createMany(values, transactionContext);
  }

  /**
   * Removes duplicate fokontany records from the collection.
   *
   * @param transactionContext - Database transaction context.
   */
  async deleteDuplicates(
    transactionContext?: DbTransactionContext,
  ): Promise<void> {
    await this._deleteDuplicates(transactionContext);
  }

  /**
   * Updates the geojson field of a fokontany record identified by its attributes.
   *
   * @param attributes - The identifying attributes for the fokontany.
   * @param geojson - The GeoJSON string value to assign.
   * @param transactionContext - Optional database transaction context.
   * @returns An object containing the number of affected rows.
   */
  async updateGeojsonByAttributes(
    attributes: FokontanyAttributes,
    geojson: string,
    transactionContext?: DbTransactionContext,
  ): Promise<DMLUpdateResult> {
    return await this._updateGeojsonByIdentifiers(
      {
        fokontany: attributes.fokontany,
        commune: attributes.commune,
        district: attributes.district,
        region: attributes.region,
      },
      geojson,
      transactionContext,
    );
  }
}

let _instance: FokontanysMongoDML | null = null;

/**
 * Injects (or creates) an instance of {@link FokontanysMongoDML}.
 *
 * @param config - The runtime ADM configuration.
 * @param db - The MongoDB database connection.
 * @returns The singleton instance of FokontanysMongoDML.
 */
export function injectFokontanysMongoDML(
  config: MadaAdmConfig,
  db: MongoDbConnection,
): FokontanysMongoDML {
  if (!_instance) _instance = new FokontanysMongoDML(config, db);
  return _instance;
}

/**
 * Resets the singleton instance of the fokontanys MongoDB DML.
 */
export function resetFokontanysMongoDML(): void {
  _instance = null;
}
