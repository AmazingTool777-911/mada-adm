import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import { BaseAdmTableMySQLDML } from "./adm-table.mysql.dml.ts";
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

/**
 * MySQL DML implementation for the districts table.
 */
export class DistrictsMySQLDML extends BaseAdmTableMySQLDML
  implements DistrictTableDML {
  constructor(
    config: MadaAdmConfigValues,
    db: MySQLDbConnection,
  ) {
    super(config, db);
  }

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

  async createMany(values: DistrictRecord[]): Promise<DMLCreateManyResult> {
    return await this._createMany(AdmLevelCode.DISTRICT, values);
  }

  async deleteDuplicates(): Promise<void> {
    await this._deleteDuplicates(AdmLevelCode.DISTRICT);
  }

  async updateGeojsonByAttributes(
    attributes: DistrictAttributes,
    geojson: string,
    transactionContext?: DbTransactionContext,
  ): Promise<DMLUpdateResult> {
    return await this._updateGeojsonByIdentifiers(
      AdmLevelCode.DISTRICT,
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
