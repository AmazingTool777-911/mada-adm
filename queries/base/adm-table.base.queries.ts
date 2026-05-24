import type { MadaAdmConfigValues } from "@scope/types/models";
import { DbType } from "@scope/consts/db";
import {
  ADM_LEVEL_TITLE_BY_CODE,
  type AdmLevelCode,
} from "@scope/consts/models";
import { prefixWithCamelCase, prefixWithSnakeCase } from "@scope/utils/string";
import {
  getAdmTableColumns,
  type GetAdmTableColumnsOptions,
} from "@scope/helpers/db";

export abstract class AdmTableBaseQueries {
  get tableName(): string {
    const baseName = `${ADM_LEVEL_TITLE_BY_CODE.get(this.admLevel)!}s`;
    return this.dbType === DbType.MongoDB
      ? prefixWithSnakeCase(this.config.tablesPrefix, baseName)
      : prefixWithCamelCase(this.config.tablesPrefix, baseName);
  }

  getColunmsWithoutGeojson(options?: GetAdmTableColumnsOptions): string[] {
    return getAdmTableColumns(this.admLevel, this.config, this.dbType, options);
  }

  constructor(
    protected config: MadaAdmConfigValues,
    protected dbType: DbType,
    protected admLevel: AdmLevelCode,
  ) {}
}
