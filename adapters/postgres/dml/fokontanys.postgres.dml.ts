import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";

import { BaseAdmPostgresTableDML } from "./adm-table.postgres.dml.ts";
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
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { PostgresDbConnection } from "../postgres-db.connection.ts";

/**
 * PostgreSQL DML implementation for the fokontanys table.
 */
export class FokontanysPostgresDML extends BaseAdmPostgresTableDML
  implements FokontanyTableDML {
  constructor(
    config: MadaAdmConfigValues,
    db: PostgresDbConnection,
    schema: string = "public",
  ) {
    super(config, db, AdmLevelCode.FOKONTANY, schema);
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
   * Inserts multiple fokontany records into the database in a single transaction.
   *
   * @param values - An array of fokontany values to insert.
   * @returns A result object containing the count of inserted rows.
   */
  async createMany(
    values: FokontanyRecord[],
    transactionContext?: DbTransactionContext,
  ): Promise<DMLCreateManyResult> {
    return await this._createMany(values, transactionContext);
  }

  /**
   * Removes duplicate fokontany records from the table.
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
      attributes,
      geojson,
      transactionContext,
    );
  }
}

let _instance: FokontanysPostgresDML | null = null;

/**
 * Injector for the FokontanysPostgresDML singleton.
 *
 * @param config - The runtime ADM configuration.
 * @param db - The singleton PostgreSQL database connection.
 * @param schema - The ADM schema binding.
 * @returns The singleton instance of FokontanysPostgresDML.
 */
export function injectFokontanysPostgresDML(
  config: MadaAdmConfigValues,
  db: PostgresDbConnection,
  schema: string = "public",
): FokontanysPostgresDML {
  if (!_instance) {
    _instance = new FokontanysPostgresDML(config, db, schema);
  }
  return _instance;
}
