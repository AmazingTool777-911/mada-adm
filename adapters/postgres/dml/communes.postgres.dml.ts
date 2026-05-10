import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
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
  MadaAdmConfigValues,
} from "@scope/types/models";

import type { PostgresDbConnection } from "../postgres-db.connection.ts";
import { BaseAdmPostgresTableDML } from "./adm-table.postgres.dml.ts";

/**
 * PostgreSQL DML implementation for the communes table.
 */
export class CommunesPostgresDML extends BaseAdmPostgresTableDML
  implements CommuneTableDML {
  constructor(
    config: MadaAdmConfigValues,
    db: PostgresDbConnection,
    schema?: string,
  ) {
    super(config, db, AdmLevelCode.COMMUNE, schema);
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
   * Inserts multiple commune records into the database in a single transaction.
   *
   * @param values - An array of commune values to insert.
   * @returns A result object containing the count of inserted rows.
   */
  async createMany(
    values: CommuneRecord[],
    transactionContext?: DbTransactionContext,
  ): Promise<DMLCreateManyResult> {
    return await this._createMany(values, transactionContext);
  }

  /**
   * Removes duplicate commune records from the table.
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
      attributes,
      geojson,
      transactionContext,
    );
  }
}

let _instance: CommunesPostgresDML | null = null;

/**
 * Injector for the CommunesPostgresDML singleton.
 *
 * @param config - The runtime ADM configuration.
 * @param db - The singleton PostgreSQL database connection.
 * @param schema - The ADM schema binding.
 * @returns The singleton instance of CommunesPostgresDML.
 */
export function injectCommunesPostgresDML(
  config: MadaAdmConfigValues,
  db: PostgresDbConnection,
  schema: string = "public",
): CommunesPostgresDML {
  if (!_instance) {
    _instance = new CommunesPostgresDML(config, db, schema);
  }
  return _instance;
}
