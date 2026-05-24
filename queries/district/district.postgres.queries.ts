import type {
  District,
  DistrictSnakeCased,
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { PostgresDbConnection } from "@scope/adapters/postgres";
import { mapDistrictSnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type {
  DistrictQueries,
  GetManyDistrictsPaginationCursor,
  GetManyDistrictsQueryParams,
} from "../queries.d.ts";
import { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";
import { DistrictBaseQueries } from "../base/district.base.queries.ts";

export class DistrictPostgresQueries extends DistrictBaseQueries
  implements DistrictQueries {
  #db!: PostgresDbConnection;
  #pgSchema!: string;

  constructor(
    config: MadaAdmConfigValues,
    db: PostgresDbConnection,
    pgSchema: string = "public",
  ) {
    super(config, DbType.Postgres);
    this.#db = db;
    this.#pgSchema = pgSchema;
  }

  #getManyCursorPaginator = new QueryCursorPaginator<
    GetManyDistrictsPaginationCursor,
    District,
    GetManyDistrictsQueryParams
  >({
    toCursor: ({ district, id }) => ({ district, id }),
    queryFn: async ({ limit, cursor }, queryParams = {}) => {
      const client = await this.#db.pool.connect();
      try {
        const tableName = `${this.#pgSchema}.${this.tableName}`;
        const columns = this.getColunmsWithoutGeojson({
          excludeGeojson: true,
        });

        let sql = `SELECT ${columns.join(", ")} FROM ${tableName}`;
        const conditions: string[] = [];
        const args: unknown[] = [];

        if (queryParams.regionId) {
          args.push(Number(queryParams.regionId));
          conditions.push(`region_id = $${args.length}`);
        }

        if (queryParams.provinceId) {
          args.push(Number(queryParams.provinceId));
          conditions.push(`province_id = $${args.length}`);
        }

        if (queryParams.search) {
          args.push(`${queryParams.search}%`);
          conditions.push(`district LIKE $${args.length}`);
        }

        if (cursor) {
          args.push(cursor.district, cursor.id);
          conditions.push(
            `(district, id) >= ($${args.length - 1}, $${args.length})`,
          );
        }

        if (conditions.length > 0) {
          sql += ` WHERE ${conditions.join(" AND ")}`;
        }

        args.push(limit);
        sql += ` ORDER BY district ASC, id ASC LIMIT $${args.length}`;

        const rows = await client.queryObject<DistrictSnakeCased>(sql, args);
        return rows.rows.map(mapDistrictSnakeToCamel);
      } finally {
        client.release();
      }
    },
  });

  override get getManyCursorPaginator() {
    return this.#getManyCursorPaginator;
  }
}

let _instance: DistrictPostgresQueries | null = null;

export function injectDistrictPostgresQueries(
  config: MadaAdmConfigValues,
  db: PostgresDbConnection,
  pgSchema?: string,
): DistrictPostgresQueries {
  return _instance ??
    (_instance = new DistrictPostgresQueries(config, db, pgSchema));
}
