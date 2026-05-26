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
  mapAdmEntityUnionSnakeCasedRecordToEntity,
} from "@scope/helpers/models";
import { getAdmEntitiesUnionPaginationCursorSchema } from "../schemas/adm-entity.schemas.ts";
import type { MySQLDbConnection } from "@scope/adapters/mysql/db";
import { getAdmTableName } from "@scope/helpers/db";
import {
  ADM_ENTITIES_UNION_TARGET_COLUMN_NAME,
  DbType,
} from "@scope/consts/db";

export type GetSelectAdmEntitiesSetQueryTemplateParam = string | bigint;

export type GetSelectAdmEntitiesSetQueryTemplateResult = {
  sql: string;
  params: GetSelectAdmEntitiesSetQueryTemplateParam[];
};

export class AdmEntityMySQLQueries extends AdmEntityBaseQueries {
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
    private dbConnection: MySQLDbConnection,
  ) {
    super();

    this.#getUnionCursorPaginator = new QueryCursorPaginator<
      GetAdmEntitiesUnionPaginationCursor,
      AdmEntity,
      GetAdmEntitiesUnionQueryParams
    >({
      toCursor: (record) => {
        return this.getGetAdmEntitiesUnionRecordToCursor(record);
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
        let unionSetsParams: GetSelectAdmEntitiesSetQueryTemplateParam[] = [];

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
          unionSetsParams.push(BigInt(limit));
          const limitClause = `LIMIT ?`;

          sql += `
            ORDER BY adm_level, ${ADM_ENTITIES_UNION_TARGET_COLUMN_NAME}, id
            ${limitClause}
          `;
        }

        await using conn = await this.dbConnection.pool.getConnection();
        const result = await conn.execute(
          sql,
          unionSetsParams,
        );
        const rows = result[0] as AdmEntitySnakeCasedUnionRecord[];

        return rows.map<AdmEntity>((row) =>
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
      DbType.MySQL,
    );
    return columnsData
      .map((colData) => {
        if (typeof colData.alias === "undefined") {
          return colData.name;
        } else {
          return `${colData.alias ?? "NULL"} AS ${colData.name}`;
        }
      })
      .join(", ");
  }

  private getSelectAdmEntitiesSetQueryTemplate(
    admLevel: AdmLevelCode,
    templateParams: GetSelectAdmEntitiesSetQueryTemplateParam[],
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
        templateParams.push(`${search}%`);
        conditionsTemplates.push(`
          ${admLevelTitle} LIKE ?
        `);
      }
      if (cursor) {
        if (
          cursor.admLevel === AdmLevelCode.COMMUNE ||
          cursor.admLevel === AdmLevelCode.FOKONTANY
        ) {
          templateParams.push(
            cursor.value,
            cursor.value,
            BigInt(Number(cursor.id)),
          );
          conditionsTemplates.push(`
            (${admLevelTitle} > ? OR (${admLevelTitle} = ? AND id >= ?))
          `);
        } else {
          templateParams.push(cursor.value);
          conditionsTemplates.push(`
            ${admLevelTitle} >= ?
          `);
        }
      }
      whereClause = ` WHERE ${conditionsTemplates.join(" AND ")}`;
    } else whereClause = "";
    const orderByClause =
      admLevel === AdmLevelCode.COMMUNE || admLevel === AdmLevelCode.FOKONTANY
        ? `ORDER BY ${admLevelTitle}, id`
        : `ORDER BY ${admLevelTitle}`;
    templateParams.push(BigInt(limit));
    const limitClause = `LIMIT ?`;
    const tableName = getAdmTableName(
      admLevel,
      this.config,
      DbType.SQLite,
    );
    const columnsClause = this.getSelectAdmEntitiesSetQueryColumnsTemplate(
      admLevel,
    );
    const sql = `
      SELECT * FROM (
        SELECT ${columnsClause}
        FROM ${tableName}${whereClause}
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

let _instance: AdmEntityMySQLQueries | null = null;

export function injectAdmEntityMySQLQueries(
  config: MadaAdmConfigValues,
  dbConnection: MySQLDbConnection,
): AdmEntityMySQLQueries {
  if (_instance) {
    return _instance;
  }
  _instance = new AdmEntityMySQLQueries(config, dbConnection);
  return _instance;
}
