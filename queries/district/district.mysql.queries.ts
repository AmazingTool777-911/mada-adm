import type {
  District,
  DistrictSnakeCased,
  EntityId,
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { MySQLDbConnection } from "@scope/adapters/mysql";
import { mapDistrictSnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type {
  GetDistrictByIdOptions,
  GetDistrictByPointCoodrdinatesOptions,
  GetManyDistrictsPaginationCursor,
  GetManyDistrictsQueryParams,
  PointCoordinates,
} from "../queries.d.ts";
import { DistrictBaseQueries } from "../base/district.base.queries.ts";
import { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";
import { getManyDistrictPaginationCursorSchema } from "../schemas/district.schemas.ts";

export class DistrictMySQLQueries extends DistrictBaseQueries {
  #db!: MySQLDbConnection;

  constructor(
    config: MadaAdmConfigValues,
    db: MySQLDbConnection,
  ) {
    super(config, DbType.MySQL);
    this.#db = db;
  }

  #getManyCursorPaginator = new QueryCursorPaginator<
    GetManyDistrictsPaginationCursor,
    District,
    GetManyDistrictsQueryParams
  >({
    toCursor: ({ district, id }) => ({ district, id }),
    queryFn: async ({ limit, cursor }, queryParams = {}) => {
      const columns = this.getTableColunms({
        excludeGeojson: true,
      });

      let sql = `SELECT ${columns.join(", ")} FROM ${this.tableName}`;
      const conditions: string[] = [];
      const args: unknown[] = [];

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
        conditions.push(`district LIKE ?`);
      }

      if (cursor) {
        args.push(cursor.district, cursor.district, cursor.id);
        conditions.push(`(district > ? OR (district = ? AND id >= ?))`);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
      }

      args.push(limit);
      sql += ` ORDER BY district ASC LIMIT ?`;

      const result = await this.#db.pool.query(
        sql,
        args,
      );
      return (result[0] as DistrictSnakeCased[]).map(mapDistrictSnakeToCamel);
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

  async getById(
    id: EntityId,
    options?: GetDistrictByIdOptions,
  ): Promise<District | null> {
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
    const rows = results[0] as DistrictSnakeCased[];
    if (rows.length === 0) return null;
    return mapDistrictSnakeToCamel(rows[0]);
  }

  async getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetDistrictByPointCoodrdinatesOptions,
  ): Promise<District | null> {
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
    const rows = results[0] as DistrictSnakeCased[];
    if (rows.length === 0) return null;
    return mapDistrictSnakeToCamel(rows[0]);
  }
}

let _instance: DistrictMySQLQueries | null = null;

export function injectDistrictMySQLQueries(
  config: MadaAdmConfigValues,
  db: MySQLDbConnection,
): DistrictMySQLQueries {
  return _instance ?? (_instance = new DistrictMySQLQueries(config, db));
}
