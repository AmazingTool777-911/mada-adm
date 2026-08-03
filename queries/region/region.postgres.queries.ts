import type {
  EntityId,
  MadaAdmConfigValues,
  Region,
  RegionSnakeCased,
} from "@scope/types/models";
import type { PostgresDbConnection } from "@scope/adapters/postgres";
import { mapRegionSnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type { GetRegionByIdOptions, RegionQueries } from "../queries.d.ts";
import type {
  GetRegionByPointCoordinatesOptions,
  PointCoordinates,
} from "../queries.d.ts";
import { RegionBaseQueries } from "../base/region.base.queries.ts";

export class RegionPostgresQueries extends RegionBaseQueries
  implements RegionQueries {
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

  async _getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetRegionByPointCoordinatesOptions,
  ): Promise<Region | null> {
    const client = await this.#db.pool.connect();
    const tableName = `${this.#pgSchema}.${this.tableName}`;
    const columns = this.getTableColunms({
      excludeGeojson: options?.excludeGeoJSON,
    });
    const sql = `
      SELECT ${columns.join(", ")}
      FROM ${tableName}
      WHERE ST_INTERSECTS(geojson, ST_SetSRID(ST_POINT($1, $2), 4326))
    `;
    const result = await client.queryObject<RegionSnakeCased>(
      sql,
      coordinates,
    );
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
