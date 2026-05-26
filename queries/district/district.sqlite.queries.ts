import type {
  District,
  DistrictSnakeCased,
  EntityId,
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { SqliteDbConnection } from "@scope/adapters/sqlite";
import { mapDistrictSnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type {
  GetManyDistrictsPaginationCursor,
  GetManyDistrictsQueryParams,
} from "../queries.d.ts";
import { DistrictBaseQueries } from "../base/district.base.queries.ts";
import { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";
import { getManyDistrictPaginationCursorSchema } from "../schemas/district.schemas.ts";

export class DistrictSqliteQueries extends DistrictBaseQueries {
  #db!: SqliteDbConnection;

  constructor(
    config: MadaAdmConfigValues,
    db: SqliteDbConnection,
  ) {
    super(config, DbType.SQLite);
    this.#db = db;
  }

  #getManyCursorPaginator = new QueryCursorPaginator<
    GetManyDistrictsPaginationCursor,
    District,
    GetManyDistrictsQueryParams
  >({
    toCursor: ({ district, id }) => ({ district, id }),
    queryFn: ({ limit, cursor }, queryParams = {}) => {
      const columns = this.getTableColunms({
        excludeGeojson: true,
      });

      let sql = `SELECT ${columns.join(", ")} FROM ${this.tableName}`;
      const conditions: string[] = [];
      const args: (EntityId | string)[] = [];

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
        conditions.push(`district LIKE ?`);
      }

      if (cursor) {
        args.push(cursor.district, cursor.id);
        conditions.push(`(district, id) >= (?, ?)`);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
      }

      args.push(limit);
      sql += ` ORDER BY district ASC LIMIT ?`;

      const rows = this.#db.client.prepare(sql).all(
        ...args,
      ) as DistrictSnakeCased[];
      return Promise.resolve(rows.map(mapDistrictSnakeToCamel));
    },
    cursorEncodedSchema: getManyDistrictPaginationCursorSchema,
  });

  override get getManyCursorPaginator(): QueryCursorPaginator<
    GetManyDistrictsPaginationCursor,
    District,
    GetManyDistrictsQueryParams
  > {
    return this.#getManyCursorPaginator;
  }
}

let _instance: DistrictSqliteQueries | null = null;

export function injectDistrictSqliteQueries(
  config: MadaAdmConfigValues,
  db: SqliteDbConnection,
): DistrictSqliteQueries {
  return _instance ?? (_instance = new DistrictSqliteQueries(config, db));
}
