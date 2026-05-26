import type z from "@zod/zod";

import {
  ADM_LEVEL_CODES_INDEXED,
  ADM_LEVEL_INDEX_BY_CODE,
  ADM_LEVEL_TITLE_BY_CODE,
  AdmLevelCode,
} from "@scope/consts/models";
import { AdmEntityBaseQueries } from "../base/adm-entity.base.queries.ts";
import { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";
import type {
  CursorPaginationParams,
  GetAdmEntitiesUnionPaginationCursor,
  GetAdmEntitiesUnionQueryParams,
} from "@scope/queries/types";
import type {
  AdmEntity,
  AdmEntitySnakeCasedUnionRecord,
  MadaAdmConfigValues,
} from "@scope/types/models";
import { getAdmEntityUnionSetColumns } from "@scope/helpers/db";
import {
  isCommuneValues,
  isDistrictValues,
  isFokontanyValues,
  isRegionValues,
  mapAdmEntityUnionSnakeCasedRecordToEntity,
} from "@scope/helpers/models";
import { getAdmEntitiesUnionPaginationCursorSchema } from "../schemas/adm-entity.schemas.ts";
import type { PostgresDbConnection } from "@scope/adapters/postgres/db";
import { getAdmTableName } from "@scope/helpers/db";
import {
  ADM_ENTITIES_UNION_TARGET_COLUMN_NAME,
  DbType,
} from "@scope/consts/db";

export type GetSelectAdmEntitiesSetQueryTemplateResult = {
  sql: string;
  params: (string | number)[];
};

export class AdmEntityPostgresQueries extends AdmEntityBaseQueries {
  #getUnionCursorPaginator!: QueryCursorPaginator<
    GetAdmEntitiesUnionPaginationCursor,
    AdmEntity,
    GetAdmEntitiesUnionQueryParams
  >;

  override get getUnionCursorPaginator(): QueryCursorPaginator<
    GetAdmEntitiesUnionPaginationCursor,
    AdmEntity,
    GetAdmEntitiesUnionQueryParams
  > {
    return this.#getUnionCursorPaginator;
  }

  constructor(
    private config: MadaAdmConfigValues,
    private dbConnection: PostgresDbConnection,
    private schema: string = "public",
  ) {
    super();

    this.#getUnionCursorPaginator = new QueryCursorPaginator<
      GetAdmEntitiesUnionPaginationCursor,
      AdmEntity,
      GetAdmEntitiesUnionQueryParams
    >({
      toCursor(record) {
        if (isFokontanyValues(record)) {
          return {
            admLevel: AdmLevelCode.FOKONTANY,
            value: record.fokontany,
            id: record.id,
          };
        } else if (isCommuneValues(record)) {
          return {
            admLevel: AdmLevelCode.COMMUNE,
            value: record.commune,
            id: record.id,
          };
        } else if (isDistrictValues(record)) {
          return { admLevel: AdmLevelCode.DISTRICT, value: record.district };
        } else if (isRegionValues(record)) {
          return { admLevel: AdmLevelCode.REGION, value: record.region };
        } else {
          return { admLevel: AdmLevelCode.PROVINCE, value: record.province };
        }
      },
      cursorEncodedSchema:
        getAdmEntitiesUnionPaginationCursorSchema as z.Schema<
          GetAdmEntitiesUnionPaginationCursor
        >,
      queryFn: async (
        { limit, cursor },
        queryParams,
      ): Promise<AdmEntity[]> => {
        const queryParamsAdmLevelIndexFrom = ADM_LEVEL_INDEX_BY_CODE.get(
          queryParams?.from ?? AdmLevelCode.PROVINCE,
        )!;
        const cursorAdmLevelIndex = cursor?.admLevel
          ? ADM_LEVEL_INDEX_BY_CODE.get(cursor.admLevel)!
          : null;
        const startingAdmLevelIndex = cursorAdmLevelIndex
          ? Math.max(queryParamsAdmLevelIndexFrom, cursorAdmLevelIndex)
          : queryParamsAdmLevelIndexFrom;

        const unionSetsTemplates: string[] = [];
        let unionSetsParams: (string | number)[] = [];

        for (
          let i = startingAdmLevelIndex;
          i < ADM_LEVEL_CODES_INDEXED.length;
          i++
        ) {
          const admLevel = ADM_LEVEL_CODES_INDEXED[i];
          const { sql, params } = this.getSelectAdmEntitiesSetQueryTemplate(
            admLevel,
            unionSetsParams,
            { cursor, limit },
            queryParams,
          );
          unionSetsTemplates.push(sql);
          unionSetsParams = params;
        }

        let sql = unionSetsTemplates.join(`
          UNION ALL
        `);
        if (
          startingAdmLevelIndex < (ADM_LEVEL_CODES_INDEXED.length - 1)
        ) {
          unionSetsParams.push(limit);
          const limitClause = `LIMIT $${unionSetsParams.length}`;

          sql += `
            ORDER BY adm_level, ${ADM_ENTITIES_UNION_TARGET_COLUMN_NAME}, id
            ${limitClause}
          `;
        }

        const client = await this.dbConnection.pool.connect();
        const result = await client.queryObject<AdmEntitySnakeCasedUnionRecord>(
          sql,
          unionSetsParams,
        );

        return result.rows.map<AdmEntity>((row) =>
          mapAdmEntityUnionSnakeCasedRecordToEntity(row)
        );
      },
    });
  }

  private getSelectAdmEntitiesSetQueryColumnsTemplate(
    admLevel: AdmLevelCode,
  ): string {
    const columnsData = getAdmEntityUnionSetColumns(
      admLevel,
      this.config,
      DbType.Postgres,
    );
    return columnsData
      .map((colData) => {
        if (typeof colData.alias === "undefined") {
          return colData.name;
        } else {
          let aliasValue = colData.alias ?? "NULL";
          if (colData.cast) {
            switch (colData.cast) {
              case "id":
                aliasValue += "::integer";
                break;
              case "text":
                aliasValue += "::text";
                break;
              default:
                break;
            }
          }
          return `${aliasValue} AS ${colData.name}`;
        }
      })
      .join(", ");
  }

  private getSelectAdmEntitiesSetQueryTemplate(
    admLevel: AdmLevelCode,
    templateParams: (string | number)[],
    paginationParams: CursorPaginationParams<
      GetAdmEntitiesUnionPaginationCursor
    >,
    queryParams: GetAdmEntitiesUnionQueryParams = {},
  ): GetSelectAdmEntitiesSetQueryTemplateResult {
    const admLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(admLevel)!;
    const { cursor, limit } = paginationParams;
    const { search } = queryParams;
    const hasConditions = search || cursor;
    let whereClause!: string;
    if (hasConditions) {
      const conditionsTemplates: string[] = [];
      if (search) {
        templateParams.push(`${search.toLocaleLowerCase("fr")}%`);
        conditionsTemplates.push(`
          lower(${admLevelTitle}) LIKE $${templateParams.length}
        `);
      }
      if (cursor) {
        if (
          cursor.admLevel === AdmLevelCode.COMMUNE ||
          cursor.admLevel === AdmLevelCode.FOKONTANY
        ) {
          templateParams.push(cursor.value, Number(cursor.id));
          const paramsLength = templateParams.length;
          conditionsTemplates.push(`
            (${admLevelTitle}, id) >= ($${paramsLength - 1}, $${paramsLength})
          `);
        } else {
          templateParams.push(cursor.value);
          conditionsTemplates.push(`
            ${admLevelTitle} >= $${templateParams.length}
          `);
        }
      }
      whereClause = ` WHERE ${conditionsTemplates.join(" AND ")}`;
    } else whereClause = "";
    const orderByClause =
      admLevel === AdmLevelCode.COMMUNE || admLevel === AdmLevelCode.FOKONTANY
        ? `ORDER BY ${admLevelTitle}, id`
        : `ORDER BY ${admLevelTitle}`;
    templateParams.push(limit);
    const limitClause = `LIMIT $${templateParams.length}`;
    const tableName = getAdmTableName(
      admLevel,
      this.config,
      DbType.Postgres,
    );
    const fullTableName = `${this.schema}.${tableName}`;
    const columnsClause = this.getSelectAdmEntitiesSetQueryColumnsTemplate(
      admLevel,
    );
    const sql = `
      SELECT * FROM (
        SELECT ${columnsClause}
        FROM ${fullTableName}${whereClause}
        ${orderByClause}
        ${limitClause}
      ) ${tableName}
    `;
    return {
      sql,
      params: templateParams,
    };
  }
}

let _instance: AdmEntityPostgresQueries | null = null;

export function injectAdmEntityPostgresQueries(
  config: MadaAdmConfigValues,
  dbConnection: PostgresDbConnection,
  pgSchema: string = "public",
): AdmEntityPostgresQueries {
  if (_instance) {
    return _instance;
  }
  _instance = new AdmEntityPostgresQueries(config, dbConnection, pgSchema);
  return _instance;
}
