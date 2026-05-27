import type {
  Commune,
  CommuneSnakeCased,
  EntityId,
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { MySQLDbConnection } from "@scope/adapters/mysql";
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

export class CommuneMySQLQueries extends CommuneBaseQueries {
  #db!: MySQLDbConnection;

  constructor(
    config: MadaAdmConfigValues,
    db: MySQLDbConnection,
  ) {
    super(config, DbType.MySQL);
    this.#db = db;
  }

  #getManyCursorPaginator = new QueryCursorPaginator<
    GetManyCommunesPaginationCursor,
    Commune,
    GetManyCommunesQueryParams
  >({
    toCursor: ({ commune, id }) => ({ commune, id }),
    cursorEncodedSchema: getManyCommunesCursorPaginatedSchema,
    queryFn: async ({ limit, cursor }, queryParams = {}) => {
      const columns = this.getTableColunms({
        excludeGeojson: true,
      });

      let sql = `SELECT ${columns.join(", ")} FROM ${this.tableName}`;
      const conditions: string[] = [];
      const args: unknown[] = [];

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
        conditions.push(`commune LIKE ?`);
      }

      if (cursor) {
        args.push(cursor.commune, cursor.commune, cursor.id);
        conditions.push(`(commune > ? OR (commune = ? AND id >= ?))`);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
      }

      args.push(limit);
      sql += ` ORDER BY commune ASC LIMIT ?`;

      const result = await this.#db.pool.query(
        sql,
        args,
      );
      return (result[0] as CommuneSnakeCased[]).map(mapCommuneSnakeToCamel);
    },
  });

  override get getManyCursorPaginator(): QueryCursorPaginator<
    GetManyCommunesPaginationCursor,
    Commune,
    GetManyCommunesQueryParams
  > {
    return this.#getManyCursorPaginator;
  }

  async getById(
    id: EntityId,
    options?: GetCommuneByIdOptions,
  ): Promise<Commune | null> {
    const columns = this.getTableColunms({
      excludeGeojson: options?.excludeGeoJSON,
    });
    const sql = `
      SELECT ${columns.join(", ")}
      FROM ${this.tableName}
      WHERE id = ?
    `;
    const results = await this.#db.pool.execute(
      sql,
      [BigInt(Number(id))],
    );
    const rows = results[0] as CommuneSnakeCased[];
    if (rows.length === 0) return null;
    return mapCommuneSnakeToCamel(rows[0]);
  }

  async getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetCommuneByPointCoordinatesOptions,
  ): Promise<Commune | null> {
    const columns = this.getTableColunms({
      excludeGeojson: options?.excludeGeoJSON,
    });
    const sql = `
      SELECT ${columns.join(", ")}
      FROM ${this.tableName}
      WHERE ST_Contains(geojson, ST_GeomFromText(?, 4326))
    `;
    const results = await this.#db.pool.execute(
      sql,
      [`POINT(${coordinates[1]} ${coordinates[0]})`],
    );
    const rows = results[0] as CommuneSnakeCased[];
    if (rows.length === 0) return null;
    return mapCommuneSnakeToCamel(rows[0]);
  }
}

let _instance: CommuneMySQLQueries | null = null;

export function injectCommuneMySQLQueries(
  config: MadaAdmConfigValues,
  db: MySQLDbConnection,
): CommuneMySQLQueries {
  return _instance ?? (_instance = new CommuneMySQLQueries(config, db));
}
