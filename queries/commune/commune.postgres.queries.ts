import type {
  Commune,
  CommuneSnakeCased,
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { PostgresDbConnection } from "@scope/adapters/postgres";
import { mapCommuneSnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type {
  CommuneQueries,
  GetManyCommunesPaginationCursor,
  GetManyCommunesQueryParams,
} from "../queries.d.ts";
import { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";
import { CommuneBaseQueries } from "../base/commune.base.queries.ts";
import { getManyCommunesCursorPaginatedSchema } from "../schemas/commune.schemas.ts";

export class CommunePostgresQueries extends CommuneBaseQueries
  implements CommuneQueries {
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
    GetManyCommunesPaginationCursor,
    Commune,
    GetManyCommunesQueryParams
  >({
    toCursor: ({ commune, id }) => ({ commune, id }),
    cursorEncodedSchema: getManyCommunesCursorPaginatedSchema,
    queryFn: async ({ limit, cursor }, queryParams = {}) => {
      const client = await this.#db.pool.connect();
      try {
        const tableName = `${this.#pgSchema}.${this.tableName}`;
        const columns = this.getTableColunms({
          excludeGeojson: true,
        });

        let sql = `SELECT ${columns.join(", ")} FROM ${tableName}`;
        const conditions: string[] = [];
        const args: unknown[] = [];

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
          conditions.push(`lower(commune) LIKE $${args.length}`);
        }

        if (cursor) {
          args.push(cursor.commune, cursor.id);
          conditions.push(
            `(commune, id) >= ($${args.length - 1}, $${args.length})`,
          );
        }

        if (conditions.length > 0) {
          sql += ` WHERE ${conditions.join(" AND ")}`;
        }

        args.push(limit);
        sql += ` ORDER BY commune ASC LIMIT $${args.length}`;

        const rows = await client.queryObject<CommuneSnakeCased>(sql, args);
        return rows.rows.map(mapCommuneSnakeToCamel);
      } finally {
        client.release();
      }
    },
  });

  override get getManyCursorPaginator() {
    return this.#getManyCursorPaginator;
  }
}

let _instance: CommunePostgresQueries | null = null;

export function injectCommunePostgresQueries(
  config: MadaAdmConfigValues,
  db: PostgresDbConnection,
  pgSchema?: string,
): CommunePostgresQueries {
  return _instance ??
    (_instance = new CommunePostgresQueries(config, db, pgSchema));
}
