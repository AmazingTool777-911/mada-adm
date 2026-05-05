import { AdmLevelCode } from "@scope/consts/models";
import { BaseAdmTableMySQLDML } from "./adm-table.mysql.dml.ts";
import type {
  DbTransactionContext,
  DMLCreateManyResult,
  DMLUpdateResult,
  EntityId,
  ProvinceTableDML,
} from "@scope/types/db";
import type {
  MadaAdmConfigValues,
  Province,
  ProvinceRecord,
} from "@scope/types/models";
import type { MySQLDbConnection } from "../mysql-db.connection.ts";

/**
 * MySQL DML implementation for the provinces table.
 */
export class ProvincesMySQLDML extends BaseAdmTableMySQLDML
  implements ProvinceTableDML {
  constructor(
    config: MadaAdmConfigValues,
    db: MySQLDbConnection,
  ) {
    super(config, db);
  }

  async getManyByNames(
    names: string[],
    transactionContext?: DbTransactionContext,
  ): Promise<Province[]> {
    return (await this._getManyByAttributes(
      AdmLevelCode.PROVINCE,
      names.map((n) => ({ province: n })),
      transactionContext,
    )) as Province[];
  }

  async updateFieldByIds(
    ids: EntityId[],
    _fieldCode: AdmLevelCode.PROVINCE,
    value: string,
    transactionContext?: DbTransactionContext,
  ): Promise<DMLUpdateResult> {
    return await this._updateFieldByIds(
      AdmLevelCode.PROVINCE,
      ids,
      "province",
      value,
      transactionContext,
    );
  }

  async createMany(values: ProvinceRecord[]): Promise<DMLCreateManyResult> {
    return await this._createMany(AdmLevelCode.PROVINCE, values);
  }

  async deleteDuplicates(): Promise<void> {
    await this._deleteDuplicates(AdmLevelCode.PROVINCE);
  }

  async updateGeojsonByName(
    name: string,
    geojson: string,
    transactionContext?: DbTransactionContext,
  ): Promise<DMLUpdateResult> {
    return await this._updateGeojsonByIdentifiers(
      AdmLevelCode.PROVINCE,
      { province: name },
      geojson,
      transactionContext,
    );
  }
}

let _instance: ProvincesMySQLDML | null = null;

export function injectProvincesMySQLDML(
  config: MadaAdmConfigValues,
  db: MySQLDbConnection,
): ProvincesMySQLDML {
  if (!_instance) {
    _instance = new ProvincesMySQLDML(config, db);
  }
  return _instance;
}

export function resetProvincesMySQLDML(): void {
  _instance = null;
}
