import type {
  EntityId,
  MadaAdmConfigValues,
  Region,
  RegionSnakeCased,
} from "@scope/types/models";
import type { PostgresDbConnection } from "@scope/adapters/postgres";
import { mapRegionSnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import { AdmLevelCode } from "@scope/consts/models";
import type { GetRegionByIdOptions, RegionQueries } from "../queries.d.ts";
import { AdmTableBaseQueries } from "../base/adm-table.base.queries.ts";

export class RegionPostgresQueries extends AdmTableBaseQueries
  implements RegionQueries {
  #db!: PostgresDbConnection;
  #pgSchema!: string;

  constructor(
    config: MadaAdmConfigValues,
    db: PostgresDbConnection,
    pgSchema: string = "public",
  ) {
    super(config, DbType.Postgres, AdmLevelCode.REGION);
    this.#db = db;
    this.#pgSchema = pgSchema;
  }

  async getAll(): Promise<Region[]> {
    const client = await this.#db.pool.connect();
    try {
      const tableName = `${this.#pgSchema}.${this.tableName}`;
      const columns = this.getTableColunms({
        excludeGeojson: true,
      });
      const sql = `
        SELECT ${columns.join(", ")}
        FROM ${tableName}
      `;
      const rows = await client.queryObject<RegionSnakeCased>(sql);
      return rows.rows.map(mapRegionSnakeToCamel);
    } finally {
      client.release();
    }
  }

  async getById(
    id: EntityId,
    options?: GetRegionByIdOptions,
  ): Promise<Region | null> {
    const client = await this.#db.pool.connect();
    const tableName = `${this.#pgSchema}.${this.tableName}`;
    const columns = this.getTableColunms({
      excludeGeojson: options?.excludeGeoJSON,
    });
    const sql = `
      SELECT ${columns.join(", ")}
      FROM ${tableName}
      WHERE id = $1
    `;
    const result = await client.queryObject<RegionSnakeCased>(sql, [
      Number(id),
    ]);
    if (result.rows.length === 0) return null;
    return mapRegionSnakeToCamel(result.rows[0]);
  }
}

let _instance: RegionPostgresQueries | null = null;

export function injectRegionPostgresQueries(
  config: MadaAdmConfigValues,
  db: PostgresDbConnection,
  pgSchema?: string,
): RegionPostgresQueries {
  return _instance ??
    (_instance = new RegionPostgresQueries(config, db, pgSchema));
}
