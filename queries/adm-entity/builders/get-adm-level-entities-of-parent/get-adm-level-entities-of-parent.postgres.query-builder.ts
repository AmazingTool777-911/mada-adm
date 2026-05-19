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

abstract class GetAdmLevelPostgresQueryBuilder
  implements GetAdmLevelEntitiesQueryBuilder<GetAdmLevelEntitiesSqlQueryBody> {
  protected columns!: string[];

  protected admLevel!: AdmLevelCode;

  #schema!: string;

  #config!: MadaAdmConfigValues;

  protected get fullTableName() {
    const tableName = prefixWithSnakeCase(
      this.#config.tablesPrefix,
      `${ADM_LEVEL_TITLE_BY_CODE.get(this.admLevel)!}s`,
    );
    return `${this.#schema}.${tableName}`;
  }

  protected get targetColumn() {
    return ADM_LEVEL_TITLE_BY_CODE.get(this.admLevel)!;
  }

  constructor(
    config: MadaAdmConfigValues,
    admLevel: AdmLevelCode,
    schema: string = "public",
  ) {
    this.admLevel = admLevel;
    this.#config = config;
    this.#schema = schema;
    this.columns = getAdmTableColumns(
      admLevel,
      config,
      DbType.Postgres,
      { excludeGeojson: true },
    );
  }

  public build(
    { identifiers, attributes, search, paramsIndexOffset = 0, limit, sort }:
      GetAdmLevelEntitiesQueryBuilderParams<
        GetAdmLevelEntitiesSqlQueryBody
      >,
  ): GetAdmLevelEntitiesSqlQueryBody {
    let paramsCount = 0;
    const params: GetAdmLevelEntitiesSqlQueryBody["params"] = [];
    const columns = attributes === "id" ? "id" : this.columns.join(", ");
    let searchWhereClause: string;
    if (search) {
      paramsCount++;
      params.push(search);
      searchWhereClause = `${this.fullTableName}.${this.targetColumn} LIKE $${
        paramsIndexOffset + paramsCount
      } || '%'`;
    } else {
      searchWhereClause = "";
    }
    let sqlTemplate!: string;
    if (identifiers.type === "id") {
      paramsCount++;
      params.push(identifiers.id);
      const idPlaceholder = `$${paramsIndexOffset + paramsCount}`;

      let orderByClause = "";
      if (sort) {
        orderByClause =
          ` ORDER BY ${this.fullTableName}.${this.targetColumn} ASC`;
      }

      let limitClause = "";
      if (limit !== undefined) {
        paramsCount++;
        params.push(limit);
        limitClause = ` LIMIT $${paramsIndexOffset + paramsCount}`;
      }

      sqlTemplate = `
        SELECT ${columns}
        FROM ${this.fullTableName}
        WHERE ${this.fullTableName}.id = ${idPlaceholder} ${
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
          WHERE ${this.fullTableName}.${prevAdmLevelFK} IN (
            ${identifiers.query.sqlTemplate}
          ) ${search ? (" AND " + searchWhereClause) : ""}
        `;
        params.push(...identifiers.query.params);
      }
      let orderByClause = "";
      if (sort) {
        orderByClause =
          ` ORDER BY ${this.fullTableName}.${this.targetColumn} ASC`;
      }

      let limitClause = "";
      if (limit !== undefined) {
        paramsCount++;
        params.push(limit);
        limitClause = ` LIMIT $${paramsIndexOffset + paramsCount}`;
      }

      sqlTemplate = `
        SELECT ${columns}
        FROM ${this.fullTableName}
        ${whereClause}${orderByClause}${limitClause}
      `;
    }
    return { sqlTemplate, params, dbType: DbType.Postgres };
  }
}

class GetProvincesPostgresQueryBuilder extends GetAdmLevelPostgresQueryBuilder {
  constructor(
    config: MadaAdmConfigValues,
    schema: string = "public",
  ) {
    super(config, AdmLevelCode.PROVINCE, schema);
  }
}

class GetRegionsPostgresQueryBuilder extends GetAdmLevelPostgresQueryBuilder {
  constructor(
    config: MadaAdmConfigValues,
    schema: string = "public",
  ) {
    super(config, AdmLevelCode.REGION, schema);
  }
}

class GetDistrictsPostgresQueryBuilder extends GetAdmLevelPostgresQueryBuilder {
  constructor(
    config: MadaAdmConfigValues,
    schema: string = "public",
  ) {
    super(config, AdmLevelCode.DISTRICT, schema);
  }
}

class GetCommunesPostgresQueryBuilder extends GetAdmLevelPostgresQueryBuilder {
  constructor(
    config: MadaAdmConfigValues,
    schema: string = "public",
  ) {
    super(config, AdmLevelCode.COMMUNE, schema);
  }
}

class GetFokontanyPostgresQueryBuilder extends GetAdmLevelPostgresQueryBuilder {
  constructor(
    config: MadaAdmConfigValues,
    schema: string = "public",
  ) {
    super(config, AdmLevelCode.FOKONTANY, schema);
  }
}

export class GetAdmLevelEntitiesOfParentPostgresQueryBuilder
  extends GetAdmLevelEntitiesOfParentQueryBuilder<
    GetAdmLevelEntitiesSqlQueryBody
  > {
  constructor(
    config: MadaAdmConfigValues,
    schema: string = "public",
  ) {
    super({
      [AdmLevelCode.PROVINCE]: new GetProvincesPostgresQueryBuilder(
        config,
        schema,
      ),
      [AdmLevelCode.REGION]: new GetRegionsPostgresQueryBuilder(
        config,
        schema,
      ),
      [AdmLevelCode.DISTRICT]: new GetDistrictsPostgresQueryBuilder(
        config,
        schema,
      ),
      [AdmLevelCode.COMMUNE]: new GetCommunesPostgresQueryBuilder(
        config,
        schema,
      ),
      [AdmLevelCode.FOKONTANY]: new GetFokontanyPostgresQueryBuilder(
        config,
        schema,
      ),
    });
  }
}

let _instance: GetAdmLevelEntitiesOfParentPostgresQueryBuilder | null = null;

export function injectGetAdmLevelEntitiesOfParentPostgresQueryBuilder(
  config: MadaAdmConfigValues,
  schema: string = "public",
) {
  return _instance ??
    (_instance = new GetAdmLevelEntitiesOfParentPostgresQueryBuilder(
      config,
      schema,
    ));
}
