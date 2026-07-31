import type {
  Commune,
  CommuneSnakeCased,
  EntityId,
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { SqliteDbConnection } from "@scope/adapters/sqlite";
import { mapCommuneSnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type {
  GetCommuneByIdOptions,
  GetCommuneByPointCoordinatesOptions,
  GetManyCommunesPaginationCursor,
  GetManyCommunesQueryParams,
  PointCoordinates,
} from "../queries.d.ts";
import { CommuneBaseQueries } from "../base/commune.base.queries.ts";
import { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";
import { getManyCommunesCursorPaginatedSchema } from "../schemas/commune.schemas.ts";

export class CommuneSqliteQueries extends CommuneBaseQueries {
  #db!: SqliteDbConnection;

  constructor(
    config: MadaAdmConfigValues,
    db: SqliteDbConnection,
  ) {
    super(config, DbType.SQLite);
    this.#db = db;
  }

  #getManyCursorPaginator = new QueryCursorPaginator<
    GetManyCommunesPaginationCursor,
    Commune,
    GetManyCommunesQueryParams
  >({
    toCursor: ({ commune, id }) => ({ commune, id }),
    cursorEncodedSchema: getManyCommunesCursorPaginatedSchema,
    queryFn: ({ limit, cursor }, queryParams = {}) => {
      const columns = this.getTableColunms({
        excludeGeojson: true,
      });

      let sql = `SELECT ${columns.join(", ")} FROM ${this.tableName}`;
      const conditions: string[] = [];
      const args: (EntityId | string)[] = [];

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
        conditions.push(`commune LIKE ?`);
      }

      if (cursor) {
        args.push(cursor.commune, cursor.id);
        conditions.push(`(commune, id) >= (?, ?)`);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
      }

      args.push(limit);
      sql += ` ORDER BY commune ASC LIMIT ?`;

      const rows = this.#db.client.prepare(sql).all(
        ...args,
      ) as CommuneSnakeCased[];
      return Promise.resolve(rows.map(mapCommuneSnakeToCamel));
    },
  });

  override get getManyCursorPaginator(): QueryCursorPaginator<
    GetManyCommunesPaginationCursor,
    Commune,
    GetManyCommunesQueryParams
  > {
    return this.#getManyCursorPaginator;
  }

  getById(id: EntityId, options?: GetCommuneByIdOptions): Commune | null {
    const columns = this.getTableColunms({
      excludeGeojson: options?.excludeGeoJSON,
    });
    const sql = `
      SELECT ${columns.join(", ")}
      FROM ${this.tableName}
      WHERE id = ?
    `;
    const rows = this.#db.client.prepare(sql).all(
      Number(id),
    ) as CommuneSnakeCased[];
    if (rows.length === 0) return null;
    return mapCommuneSnakeToCamel(rows[0]);
  }

  _getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetCommuneByPointCoordinatesOptions,
  ): Commune | null {
    const columns = this.getTableColunms({
      excludeGeojson: options?.excludeGeoJSON,
    });
    const sql = `
      SELECT ${columns.join(", ")}
      FROM ${this.tableName}
      WHERE Contains(geojson, MakePoint(?, ?, 4326))
    `;
    const rows = this.#db.client
      .prepare(sql)
      .all(...coordinates) as CommuneSnakeCased[];
    if (rows.length === 0) return null;
    return mapCommuneSnakeToCamel(rows[0]);
  }
}

let _instance: CommuneSqliteQueries | null = null;

export function injectCommuneSqliteQueries(
  config: MadaAdmConfigValues,
  db: SqliteDbConnection,
): CommuneSqliteQueries {
  return _instance ?? (_instance = new CommuneSqliteQueries(config, db));
}
