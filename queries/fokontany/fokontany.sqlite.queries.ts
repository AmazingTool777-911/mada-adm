import type {
  EntityId,
  Fokontany,
  FokontanySnakeCased,
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { SqliteDbConnection } from "@scope/adapters/sqlite";
import { mapFokontanySnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type {
  GetManyFokontanysPaginationCursor,
  GetManyFokontanysQueryParams,
} from "../queries.d.ts";
import { FokontanyBaseQueries } from "../base/fokontany.base.queries.ts";
import { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";
import { getManyFokontanysPaginationCursorSchema } from "../schemas/fokontany.schemas.ts";

export class FokontanySqliteQueries extends FokontanyBaseQueries {
  #db!: SqliteDbConnection;

  constructor(
    config: MadaAdmConfigValues,
    db: SqliteDbConnection,
  ) {
    super(config, DbType.SQLite);
    this.#db = db;
  }

  #getManyCursorPaginator = new QueryCursorPaginator<
    GetManyFokontanysPaginationCursor,
    Fokontany,
    GetManyFokontanysQueryParams
  >({
    toCursor: ({ fokontany, id }) => ({ fokontany, id }),
    cursorEncodedSchema: getManyFokontanysPaginationCursorSchema,
    queryFn: ({ limit, cursor }, queryParams = {}) => {
      const columns = this.getTableColunms({
        excludeGeojson: true,
      });

      let sql = `SELECT ${columns.join(", ")} FROM ${this.tableName}`;
      const conditions: string[] = [];
      const args: (EntityId | string)[] = [];

      if (queryParams.communeId) {
        args.push(Number(queryParams.communeId));
        conditions.push(`commune_id = ?`);
      }

      if (queryParams.districtId) {
        args.push(Number(queryParams.districtId));
        conditions.push(`district_id = ?`);
      }

      if (queryParams.regionId) {
        args.push(Number(queryParams.regionId));
        conditions.push(`region_id = ?`);
      }

      if (queryParams.provinceId) {
        args.push(Number(queryParams.provinceId));
        conditions.push(`province_id = ?`);
      }

      if (queryParams.search) {
        args.push(`${queryParams.search}%`);
        conditions.push(`fokontany LIKE ?`);
      }

      if (cursor) {
        args.push(cursor.fokontany, cursor.id);
        conditions.push(`(fokontany, id) >= (?, ?)`);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
      }

      args.push(limit);
      sql += ` ORDER BY fokontany ASC LIMIT ?`;

      const rows = this.#db.client.prepare(sql).all(
        ...args,
      ) as FokontanySnakeCased[];
      return Promise.resolve(rows.map(mapFokontanySnakeToCamel));
    },
  });

  override get getManyCursorPaginator(): QueryCursorPaginator<
    GetManyFokontanysPaginationCursor,
    Fokontany,
    GetManyFokontanysQueryParams
  > {
    return this.#getManyCursorPaginator;
  }
}

let _instance: FokontanySqliteQueries | null = null;

export function injectFokontanySqliteQueries(
  config: MadaAdmConfigValues,
  db: SqliteDbConnection,
): FokontanySqliteQueries {
  return _instance ?? (_instance = new FokontanySqliteQueries(config, db));
}
