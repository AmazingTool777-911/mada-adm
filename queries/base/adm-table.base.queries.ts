import type { MadaAdmConfigValues } from "@scope/types/models";
import type { DbType } from "@scope/consts/db";
import type { AdmLevelCode } from "@scope/consts/models";
import {
  getAdmTableColumns,
  type GetAdmTableColumnsOptions,
  getAdmTableName,
} from "@scope/helpers/db";

export abstract class AdmTableBaseQueries {
  get tableName(): string {
    return getAdmTableName(this.admLevel, this.config, this.dbType);
  }

  getTableColunms(options?: GetAdmTableColumnsOptions): string[] {
    return getAdmTableColumns(this.admLevel, this.config, this.dbType, options);
  }

  constructor(
    protected config: MadaAdmConfigValues,
    protected dbType: DbType,
    protected admLevel: AdmLevelCode,
  ) {}
}
