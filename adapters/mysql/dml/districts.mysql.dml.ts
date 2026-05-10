import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import type {
  DbTransactionContext,
  DistrictTableDML,
  DMLCreateManyResult,
  DMLUpdateResult,
  EntityId,
} from "@scope/types/db";
import type {
  District,
  DistrictAttributes,
  DistrictRecord,
  MadaAdmConfigValues,
} from "@scope/types/models";

import type { MySQLDbConnection } from "../mysql-db.connection.ts";
import { BaseAdmTableMySQLDML } from "./adm-table.mysql.dml.ts";

/**
 * MySQL DML implementation for the districts table.
 */
export class DistrictsMySQLDML extends BaseAdmTableMySQLDML
  implements DistrictTableDML {
  constructor(
    config: MadaAdmConfigValues,
    db: MySQLDbConnection,
  ) {
    super(config, db, AdmLevelCode.DISTRICT);
  }

  async getManyByAttributes(
    attributes: DistrictAttributes[],
    transactionContext?: DbTransactionContext,
  ): Promise<District[]> {
    return (await this._getManyByAttributes(
      attributes,
      transactionContext,
    )) as District[];
  }

  async getManyByRegionIds(
    regionIds: EntityId[],
    transactionContext?: DbTransactionContext,
  ): Promise<District[]> {
    return (await this._getManyByParentsIds(
      regionIds,
      transactionContext,
    )) as District[];
  }

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

  async createMany(
    values: DistrictRecord[],
    transactionContext?: DbTransactionContext,
  ): Promise<DMLCreateManyResult> {
    return await this._createMany(values, transactionContext);
  }

  async deleteDuplicates(
    transactionContext?: DbTransactionContext,
  ): Promise<void> {
    await this._deleteDuplicates(transactionContext);
  }

  async updateGeojsonByAttributes(
    attributes: DistrictAttributes,
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

let _instance: DistrictsMySQLDML | null = null;

export function injectDistrictsMySQLDML(
  config: MadaAdmConfigValues,
  db: MySQLDbConnection,
): DistrictsMySQLDML {
  if (!_instance) {
    _instance = new DistrictsMySQLDML(config, db);
  }
  return _instance;
}

export function resetDistrictsMySQLDML(): void {
  _instance = null;
}
