import type {
  EntityId,
  Fokontany,
  FokontanySnakeCased,
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { MySQLDbConnection } from "@scope/adapters/mysql";
import { mapFokontanySnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type {
  GetFokontanyByIdOptions,
  GetFokontanyByPointCoordinatesOptions,
  GetManyFokontanysPaginationCursor,
  GetManyFokontanysQueryParams,
  PointCoordinates,
} from "../queries.d.ts";
import { FokontanyBaseQueries } from "../base/fokontany.base.queries.ts";
import { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";
import { getManyFokontanysPaginationCursorSchema } from "../schemas/fokontany.schemas.ts";

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
    cursorEncodedSchema: getManyFokontanysPaginationCursorSchema,
    queryFn: async ({ limit, cursor }, queryParams = {}) => {
      const columns = this.getTableColunms({
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

  async getById(
    id: EntityId,
    options?: GetFokontanyByIdOptions,
  ): Promise<Fokontany | null> {
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
    const rows = results[0] as FokontanySnakeCased[];
    if (rows.length === 0) return null;
    return mapFokontanySnakeToCamel(rows[0]);
  }

  async _getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetFokontanyByPointCoordinatesOptions,
  ): Promise<Fokontany | null> {
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
    const rows = results[0] as FokontanySnakeCased[];
    if (rows.length === 0) return null;
    return mapFokontanySnakeToCamel(rows[0]);
  }
}

let _instance: FokontanyMySQLQueries | null = null;

export function injectFokontanyMySQLQueries(
  config: MadaAdmConfigValues,
  db: MySQLDbConnection,
): FokontanyMySQLQueries {
  return _instance ?? (_instance = new FokontanyMySQLQueries(config, db));
}
