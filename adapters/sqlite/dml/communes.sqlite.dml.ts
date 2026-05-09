import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import { BaseAdmTableSqliteDML } from "./adm-table.sqlite.dml.ts";
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
import type { SqliteDbConnection } from "../sqlite-db.connection.ts";

/**
 * SQLite DML implementation for the communes table.
 */
export class CommunesSqliteDML extends BaseAdmTableSqliteDML
  implements CommuneTableDML {
  constructor(
    config: MadaAdmConfigValues,
    db: SqliteDbConnection,
  ) {
    super(config, db, AdmLevelCode.COMMUNE);
  }

  getManyByAttributes(
    attributes: CommuneAttributes[],
    transactionContext?: DbTransactionContext,
  ): Commune[] {
    return this._getManyByAttributes(
      attributes,
      transactionContext,
    ) as Commune[];
  }

  getManyByDistrictIds(
    districtIds: EntityId[],
    _transactionContext?: DbTransactionContext,
  ): Commune[] {
    return this._getManyByParentsIds(
      districtIds,
    ) as Commune[];
  }

  updateFieldByIds(
    ids: EntityId[],
    fieldCode:
      | AdmLevelCode.COMMUNE
      | AdmLevelCode.DISTRICT
      | AdmLevelCode.REGION
      | AdmLevelCode.PROVINCE,
    value: string,
    transactionContext?: DbTransactionContext,
  ): DMLUpdateResult {
    const column = ADM_LEVEL_TITLE_BY_CODE.get(fieldCode)!;
    return this._updateFieldByIds(ids, column, value, transactionContext);
  }

  createMany(values: CommuneRecord[]): DMLCreateManyResult {
    return this._createMany(values);
  }

  deleteDuplicates(): void {
    this._deleteDuplicates();
  }

  updateGeojsonByAttributes(
    attributes: CommuneAttributes,
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

let _instance: CommunesSqliteDML | null = null;

export function injectCommunesSqliteDML(
  config: MadaAdmConfigValues,
  db: SqliteDbConnection,
): CommunesSqliteDML {
  if (!_instance) {
    _instance = new CommunesSqliteDML(config, db);
  }
  return _instance;
}

export function resetCommunesSqliteDML(): void {
  _instance = null;
}
