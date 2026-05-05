import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import { BaseAdmTableMySQLDML } from "./adm-table.mysql.dml.ts";
import type {
  DbTransactionContext,
  DMLCreateManyResult,
  DMLUpdateResult,
  EntityId,
  FokontanyTableDML,
} from "@scope/types/db";
import type {
  Fokontany,
  FokontanyAttributes,
  FokontanyRecord,
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { MySQLDbConnection } from "../mysql-db.connection.ts";

/**
 * MySQL DML implementation for the fokontanys table.
 */
export class FokontanysMySQLDML extends BaseAdmTableMySQLDML
  implements FokontanyTableDML {
  constructor(
    config: MadaAdmConfigValues,
    db: MySQLDbConnection,
  ) {
    super(config, db);
  }

  async getManyByAttributes(
    attributes: FokontanyAttributes[],
    transactionContext?: DbTransactionContext,
  ): Promise<Fokontany[]> {
    return (await this._getManyByAttributes(
      AdmLevelCode.FOKONTANY,
      attributes,
      transactionContext,
    )) as Fokontany[];
  }

  async getManyByCommuneIds(
    communeIds: EntityId[],
    transactionContext?: DbTransactionContext,
  ): Promise<Fokontany[]> {
    return (await this._getManyByParentsIds(
      AdmLevelCode.FOKONTANY,
      communeIds,
      transactionContext,
    )) as Fokontany[];
  }

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
    return await this._updateFieldByIds(
      AdmLevelCode.FOKONTANY,
      ids,
      column,
      value,
      transactionContext,
    );
  }

  async createMany(values: FokontanyRecord[]): Promise<DMLCreateManyResult> {
    return await this._createMany(AdmLevelCode.FOKONTANY, values);
  }

  async deleteDuplicates(): Promise<void> {
    await this._deleteDuplicates(AdmLevelCode.FOKONTANY);
  }

  async updateGeojsonByAttributes(
    attributes: FokontanyAttributes,
    geojson: string,
    transactionContext?: DbTransactionContext,
  ): Promise<DMLUpdateResult> {
    return await this._updateGeojsonByIdentifiers(
      AdmLevelCode.FOKONTANY,
      attributes,
      geojson,
      transactionContext,
    );
  }
}

let _instance: FokontanysMySQLDML | null = null;

export function injectFokontanysMySQLDML(
  config: MadaAdmConfigValues,
  db: MySQLDbConnection,
): FokontanysMySQLDML {
  if (!_instance) {
    _instance = new FokontanysMySQLDML(config, db);
  }
  return _instance;
}

export function resetFokontanysMySQLDML(): void {
  _instance = null;
}
