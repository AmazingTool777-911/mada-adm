import type {
  Fokontany,
  FokontanySnakeCased,
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { PostgresDbConnection } from "@scope/adapters/postgres";
import { mapFokontanySnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type {
  FokontanyQueries,
  GetManyFokontanysPaginationCursor,
  GetManyFokontanysQueryParams,
} from "../queries.d.ts";
import { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";
import { FokontanyBaseQueries } from "../base/fokontany.base.queries.ts";
import { getManyFokontanysPaginationCursorSchema } from "../schemas/fokontany.schemas.ts";

export class FokontanyPostgresQueries extends FokontanyBaseQueries
  implements FokontanyQueries {
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
    GetManyFokontanysPaginationCursor,
    Fokontany,
    GetManyFokontanysQueryParams
  >({
    toCursor: ({ fokontany, id }) => ({ fokontany, id }),
    cursorEncodedSchema: getManyFokontanysPaginationCursorSchema,
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

        if (queryParams.communeId) {
          args.push(Number(queryParams.communeId));
          conditions.push(`commune_id = $${args.length}`);
        }

        if (queryParams.districtId) {
          args.push(Number(queryParams.districtId));
          conditions.push(`district_id = $${args.length}`);
        }

        if (queryParams.regionId) {
          args.push(Number(queryParams.regionId));
          conditions.push(`region_id = $${args.length}`);
        }

        if (queryParams.provinceId) {
          args.push(Number(queryParams.provinceId));
          conditions.push(`province_id = $${args.length}`);
        }

        if (queryParams.search) {
          args.push(`${queryParams.search.toLocaleLowerCase("fr")}%`);
          conditions.push(`lower(fokontany) LIKE $${args.length}`);
        }

        if (cursor) {
          args.push(cursor.fokontany, cursor.id);
          conditions.push(
            `(fokontany, id) >= ($${args.length - 1}, $${args.length})`,
          );
        }

        if (conditions.length > 0) {
          sql += ` WHERE ${conditions.join(" AND ")}`;
        }

        args.push(limit);
        sql += ` ORDER BY fokontany ASC LIMIT $${args.length}`;

        const rows = await client.queryObject<FokontanySnakeCased>(sql, args);
        return rows.rows.map(mapFokontanySnakeToCamel);
      } finally {
        client.release();
      }
    },
  });

  override get getManyCursorPaginator() {
    return this.#getManyCursorPaginator;
  }
}

let _instance: FokontanyPostgresQueries | null = null;

export function injectFokontanyPostgresQueries(
  config: MadaAdmConfigValues,
  db: PostgresDbConnection,
  pgSchema?: string,
): FokontanyPostgresQueries {
  return _instance ??
    (_instance = new FokontanyPostgresQueries(config, db, pgSchema));
}
