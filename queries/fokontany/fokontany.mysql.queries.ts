import type {
  Fokontany,
  FokontanySnakeCased,
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { MySQLDbConnection } from "@scope/adapters/mysql";
import { mapFokontanySnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type {
  GetManyFokontanysPaginationCursor,
  GetManyFokontanysQueryParams,
} from "../queries.d.ts";
import { FokontanyBaseQueries } from "../base/fokontany.base.queries.ts";
import { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";

export class FokontanyMySQLQueries extends FokontanyBaseQueries {
  #db!: MySQLDbConnection;

  constructor(
    config: MadaAdmConfigValues,
    db: MySQLDbConnection,
  ) {
    super(config, DbType.MySQL);
    this.#db = db;
  }

  #getManyCursorPaginator = new QueryCursorPaginator<
    GetManyFokontanysPaginationCursor,
    Fokontany,
    GetManyFokontanysQueryParams
  >({
    toCursor: ({ fokontany, id }) => ({ fokontany, id }),
    queryFn: async ({ limit, cursor }, queryParams = {}) => {
      const columns = this.getColunmsWithoutGeojson({
        excludeGeojson: true,
      });

      let sql = `SELECT ${columns.join(", ")} FROM ${this.tableName}`;
      const conditions: string[] = [];
      const args: unknown[] = [];

      if (queryParams.communeId) {
        args.push(queryParams.communeId);
        conditions.push(`commune_id = ?`);
      }

      if (queryParams.districtId) {
        args.push(queryParams.districtId);
        conditions.push(`district_id = ?`);
      }

      if (queryParams.regionId) {
        args.push(queryParams.regionId);
        conditions.push(`region_id = ?`);
      }

      if (queryParams.provinceId) {
        args.push(queryParams.provinceId);
        conditions.push(`province_id = ?`);
      }

      if (queryParams.search) {
        args.push(`${queryParams.search}%`);
        conditions.push(`fokontany LIKE ?`);
      }

      if (cursor) {
        args.push(cursor.fokontany, cursor.fokontany, cursor.id);
        conditions.push(`(fokontany > ? OR (fokontany = ? AND id >= ?))`);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
      }

      args.push(limit);
      sql += ` ORDER BY fokontany ASC LIMIT ?`;

      const result = await this.#db.pool.query(
        sql,
        args,
      );
      return (result[0] as FokontanySnakeCased[]).map(mapFokontanySnakeToCamel);
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

let _instance: FokontanyMySQLQueries | null = null;

export function injectFokontanyMySQLQueries(
  config: MadaAdmConfigValues,
  db: MySQLDbConnection,
): FokontanyMySQLQueries {
  return _instance ?? (_instance = new FokontanyMySQLQueries(config, db));
}
