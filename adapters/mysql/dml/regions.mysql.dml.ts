import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import type {
  DbTransactionContext,
  DMLCreateManyResult,
  DMLUpdateResult,
  EntityId,
  RegionTableDML,
} from "@scope/types/db";
import type {
  MadaAdmConfigValues,
  Region,
  RegionRecord,
} from "@scope/types/models";
import type { MySQLDbConnection } from "../mysql-db.connection.ts";
import { BaseAdmTableMySQLDML } from "./adm-table.mysql.dml.ts";

/**
 * MySQL DML implementation for the regions table.
 */
export class RegionsMySQLDML extends BaseAdmTableMySQLDML
  implements RegionTableDML {
  constructor(
    config: MadaAdmConfigValues,
    db: MySQLDbConnection,
  ) {
    super(config, db, AdmLevelCode.REGION);
  }

  async getManyByNames(
    names: string[],
    transactionContext?: DbTransactionContext,
  ): Promise<Region[]> {
    return (await this._getManyByAttributes(
      names.map((n) => ({ region: n })),
      transactionContext,
    )) as Region[];
  }

  async getManyByProvinceIds(
    provinceIds: EntityId[],
    transactionContext?: DbTransactionContext,
  ): Promise<Region[]> {
    return (await this._getManyByParentsIds(
      provinceIds,
      transactionContext,
    )) as Region[];
  }

  async updateFieldByIds(
    ids: EntityId[],
    fieldCode: AdmLevelCode.REGION | AdmLevelCode.PROVINCE,
    value: string,
    transactionContext?: DbTransactionContext,
  ): Promise<DMLUpdateResult> {
    const column = ADM_LEVEL_TITLE_BY_CODE.get(fieldCode)!;
    return await this._updateFieldByIds(ids, column, value, transactionContext);
  }

  async createMany(values: RegionRecord[]): Promise<DMLCreateManyResult> {
    return await this._createMany(values);
  }

  async deleteDuplicates(): Promise<void> {
    await this._deleteDuplicates();
  }

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

let _instance: RegionsMySQLDML | null = null;

export function injectRegionsMySQLDML(
  config: MadaAdmConfigValues,
  db: MySQLDbConnection,
): RegionsMySQLDML {
  if (!_instance) {
    _instance = new RegionsMySQLDML(config, db);
  }
  return _instance;
}

export function resetRegionsMySQLDML(): void {
  _instance = null;
}
