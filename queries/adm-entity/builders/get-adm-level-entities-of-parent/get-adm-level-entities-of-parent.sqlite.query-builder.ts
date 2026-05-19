import {
  ADM_LEVEL_CODES_INDEXED,
  ADM_LEVEL_INDEX_BY_CODE,
  ADM_LEVEL_TITLE_BY_CODE,
  AdmLevelCode,
} from "@scope/consts/models";
import { DbType } from "@scope/consts/db";
import {
  GetAdmLevelEntitiesOfParentQueryBuilder,
  type GetAdmLevelEntitiesQueryBuilder,
  type GetAdmLevelEntitiesQueryBuilderParams,
  type GetAdmLevelEntitiesSqlQueryBody,
} from "./get-adm-level-entities-of-parent.query-builder.ts";
import { getAdmTableColumns } from "@scope/helpers/db";
import type { MadaAdmConfigValues } from "@scope/types/models";
import { prefixWithSnakeCase } from "@scope/utils/string";

abstract class GetAdmLevelSqliteQueryBuilder
  implements GetAdmLevelEntitiesQueryBuilder<GetAdmLevelEntitiesSqlQueryBody> {
  protected columns!: string[];

  protected admLevel!: AdmLevelCode;

  #config!: MadaAdmConfigValues;

  protected get tableName() {
    return prefixWithSnakeCase(
      this.#config.tablesPrefix,
      `${ADM_LEVEL_TITLE_BY_CODE.get(this.admLevel)!}s`,
    );
  }

  protected get targetColumn() {
    return ADM_LEVEL_TITLE_BY_CODE.get(this.admLevel)!;
  }

  constructor(
    config: MadaAdmConfigValues,
    admLevel: AdmLevelCode,
  ) {
    this.admLevel = admLevel;
    this.#config = config;
    this.columns = getAdmTableColumns(
      admLevel,
      config,
      DbType.SQLite,
      { excludeGeojson: true },
    );
  }

  public build(
    { identifiers, attributes, search, limit, sort }:
      GetAdmLevelEntitiesQueryBuilderParams<
        GetAdmLevelEntitiesSqlQueryBody
      >,
  ): GetAdmLevelEntitiesSqlQueryBody {
    const params: GetAdmLevelEntitiesSqlQueryBody["params"] = [];
    const columns = attributes === "id" ? "id" : this.columns.join(", ");
    let searchWhereClause: string;
    if (search) {
      searchWhereClause =
        `${this.tableName}.${this.targetColumn} LIKE ? || '%'`;
    } else {
      searchWhereClause = "";
    }
    let sqlTemplate!: string;
    if (identifiers.type === "id") {
      params.push(identifiers.id);
      if (search) {
        params.push(search);
      }

      let orderByClause = "";
      if (sort) {
        orderByClause = ` ORDER BY ${this.tableName}.${this.targetColumn} ASC`;
      }

      let limitClause = "";
      if (limit !== undefined) {
        params.push(limit);
        limitClause = ` LIMIT ?`;
      }

      sqlTemplate = `
        SELECT ${columns}
        FROM ${this.tableName}
        WHERE ${this.tableName}.id = ? ${
        search ? (" AND " + searchWhereClause) : ""
      }${orderByClause}${limitClause}
      `;
    } else {
      let whereClause!: string;
      if (this.admLevel === AdmLevelCode.PROVINCE) {
        whereClause = search ? `WHERE ${searchWhereClause}` : "";
      } else {
        const prevAdmLevel = ADM_LEVEL_CODES_INDEXED[
          ADM_LEVEL_INDEX_BY_CODE.get(this.admLevel)! - 1
        ];
        const prevAdmLevelFK = `${ADM_LEVEL_TITLE_BY_CODE.get(
          prevAdmLevel,
        )!}_id`;
        whereClause = `
          WHERE ${this.tableName}.${prevAdmLevelFK} IN (
            ${identifiers.query.sqlTemplate}
          ) ${search ? (" AND " + searchWhereClause) : ""}
        `;
        params.push(...identifiers.query.params);
      }
      if (search) {
        params.push(search);
      }

      let orderByClause = "";
      if (sort) {
        orderByClause = ` ORDER BY ${this.tableName}.${this.targetColumn} ASC`;
      }

      let limitClause = "";
      if (limit !== undefined) {
        params.push(limit);
        limitClause = ` LIMIT ?`;
      }

      sqlTemplate = `
        SELECT ${columns}
        FROM ${this.tableName}
        ${whereClause}${orderByClause}${limitClause}
      `;
    }
    return { sqlTemplate, params, dbType: DbType.SQLite };
  }
}

class GetProvincesSqliteQueryBuilder extends GetAdmLevelSqliteQueryBuilder {
  constructor(config: MadaAdmConfigValues) {
    super(config, AdmLevelCode.PROVINCE);
  }
}

class GetRegionsSqliteQueryBuilder extends GetAdmLevelSqliteQueryBuilder {
  constructor(config: MadaAdmConfigValues) {
    super(config, AdmLevelCode.REGION);
  }
}

class GetDistrictsSqliteQueryBuilder extends GetAdmLevelSqliteQueryBuilder {
  constructor(config: MadaAdmConfigValues) {
    super(config, AdmLevelCode.DISTRICT);
  }
}

class GetCommunesSqliteQueryBuilder extends GetAdmLevelSqliteQueryBuilder {
  constructor(config: MadaAdmConfigValues) {
    super(config, AdmLevelCode.COMMUNE);
  }
}

class GetFokontanySqliteQueryBuilder extends GetAdmLevelSqliteQueryBuilder {
  constructor(config: MadaAdmConfigValues) {
    super(config, AdmLevelCode.FOKONTANY);
  }
}

export class GetAdmLevelEntitiesOfParentSqliteQueryBuilder
  extends GetAdmLevelEntitiesOfParentQueryBuilder<
    GetAdmLevelEntitiesSqlQueryBody
  > {
  constructor(config: MadaAdmConfigValues) {
    super({
      [AdmLevelCode.PROVINCE]: new GetProvincesSqliteQueryBuilder(config),
      [AdmLevelCode.REGION]: new GetRegionsSqliteQueryBuilder(config),
      [AdmLevelCode.DISTRICT]: new GetDistrictsSqliteQueryBuilder(config),
      [AdmLevelCode.COMMUNE]: new GetCommunesSqliteQueryBuilder(config),
      [AdmLevelCode.FOKONTANY]: new GetFokontanySqliteQueryBuilder(config),
    });
  }
}

let _instance: GetAdmLevelEntitiesOfParentSqliteQueryBuilder | null = null;

export function injectGetAdmLevelEntitiesOfParentSqliteQueryBuilder(
  config: MadaAdmConfigValues,
) {
  return _instance ??
    (_instance = new GetAdmLevelEntitiesOfParentSqliteQueryBuilder(config));
}
