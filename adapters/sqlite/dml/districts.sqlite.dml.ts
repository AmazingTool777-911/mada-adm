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

import type { SqliteDbConnection } from "../sqlite-db.connection.ts";
import { BaseAdmTableSqliteDML } from "./adm-table.sqlite.dml.ts";

/**
 * SQLite DML implementation for the districts table.
 */
export class DistrictsSqliteDML extends BaseAdmTableSqliteDML
  implements DistrictTableDML {
  constructor(
    config: MadaAdmConfigValues,
    db: SqliteDbConnection,
  ) {
    super(config, db, AdmLevelCode.DISTRICT);
  }

  getManyByAttributes(
    attributes: DistrictAttributes[],
    transactionContext?: DbTransactionContext,
  ): District[] {
    return this._getManyByAttributes(
      attributes,
      transactionContext,
    ) as District[];
  }

  getManyByRegionIds(
    regionIds: EntityId[],
    _transactionContext?: DbTransactionContext,
  ): District[] {
    return this._getManyByParentsIds(
      regionIds,
    ) as District[];
  }

  updateFieldByIds(
    ids: EntityId[],
    fieldCode:
      | AdmLevelCode.DISTRICT
      | AdmLevelCode.REGION
      | AdmLevelCode.PROVINCE,
    value: string,
    transactionContext?: DbTransactionContext,
  ): DMLUpdateResult {
    const column = ADM_LEVEL_TITLE_BY_CODE.get(fieldCode)!;
    return this._updateFieldByIds(ids, column, value, transactionContext);
  }

  createMany(values: DistrictRecord[]): DMLCreateManyResult {
    return this._createMany(values);
  }

  deleteDuplicates(): void {
    this._deleteDuplicates();
  }

  updateGeojsonByAttributes(
    attributes: DistrictAttributes,
    geojson: string,
    transactionContext?: DbTransactionContext,
  ): DMLUpdateResult {
    return this._updateGeojsonByIdentifiers(
      attributes,
      geojson,
      transactionContext,
    );
  }
}

let _instance: DistrictsSqliteDML | null = null;

export function injectDistrictsSqliteDML(
  config: MadaAdmConfigValues,
  db: SqliteDbConnection,
): DistrictsSqliteDML {
  if (!_instance) {
    _instance = new DistrictsSqliteDML(config, db);
  }
  return _instance;
}

export function resetDistrictsSqliteDML(): void {
  _instance = null;
}
