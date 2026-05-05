import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import { BaseAdmTableMySQLDML } from "./adm-table.mysql.dml.ts";
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
import type { MySQLDbConnection } from "../mysql-db.connection.ts";

/**
 * MySQL DML implementation for the communes table.
 */
export class CommunesMySQLDML extends BaseAdmTableMySQLDML
  implements CommuneTableDML {
  constructor(
    config: MadaAdmConfigValues,
    db: MySQLDbConnection,
  ) {
    super(config, db);
  }

  async getManyByAttributes(
    attributes: CommuneAttributes[],
    transactionContext?: DbTransactionContext,
  ): Promise<Commune[]> {
    return (await this._getManyByAttributes(
      AdmLevelCode.COMMUNE,
      attributes,
      transactionContext,
    )) as Commune[];
  }

  async getManyByDistrictIds(
    districtIds: EntityId[],
    transactionContext?: DbTransactionContext,
  ): Promise<Commune[]> {
    return (await this._getManyByParentsIds(
      AdmLevelCode.COMMUNE,
      districtIds,
      transactionContext,
    )) as Commune[];
  }

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
    return await this._updateFieldByIds(
      AdmLevelCode.COMMUNE,
      ids,
      column,
      value,
      transactionContext,
    );
  }

  async createMany(values: CommuneRecord[]): Promise<DMLCreateManyResult> {
    return await this._createMany(AdmLevelCode.COMMUNE, values);
  }

  async deleteDuplicates(): Promise<void> {
    await this._deleteDuplicates(AdmLevelCode.COMMUNE);
  }

  async updateGeojsonByAttributes(
    attributes: CommuneAttributes,
    geojson: string,
    transactionContext?: DbTransactionContext,
  ): Promise<DMLUpdateResult> {
    return await this._updateGeojsonByIdentifiers(
      AdmLevelCode.COMMUNE,
      attributes,
      geojson,
      transactionContext,
    );
  }
}

let _instance: CommunesMySQLDML | null = null;

export function injectCommunesMySQLDML(
  config: MadaAdmConfigValues,
  db: MySQLDbConnection,
): CommunesMySQLDML {
  if (!_instance) {
    _instance = new CommunesMySQLDML(config, db);
  }
  return _instance;
}

export function resetCommunesMySQLDML(): void {
  _instance = null;
}
