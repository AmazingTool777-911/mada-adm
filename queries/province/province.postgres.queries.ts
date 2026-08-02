import type {
  EntityId,
  MadaAdmConfigValues,
  Province,
  ProvinceSnakeCased,
} from "@scope/types/models";
import type { PostgresDbConnection } from "@scope/adapters/postgres";
import { mapProvinceSnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type { GetProvinceByIdOptions, ProvinceQueries } from "../queries.d.ts";
import type {
  GetProvinceByPointCoordinatesOptions,
  PointCoordinates,
} from "../queries.d.ts";
import { ProvinceBaseQueries } from "../base/province.base.queries.ts";

export class ProvincePostgresQueries extends ProvinceBaseQueries
  implements ProvinceQueries {
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

  async getAll(): Promise<Province[]> {
    const client = await this.#db.pool.connect();
    const tableName = `${this.#pgSchema}.${this.tableName}`;
    const columns = this.getTableColunms({
      excludeGeojson: true,
    });
    const sql = `
      SELECT ${columns.join(", ")}
      FROM ${tableName}
    `;
    const rows = await client.queryObject<ProvinceSnakeCased>(sql);
    return rows.rows.map(mapProvinceSnakeToCamel);
  }

  async getById(
    id: EntityId,
    options?: GetProvinceByIdOptions,
  ): Promise<Province | null> {
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
    const result = await client.queryObject<ProvinceSnakeCased>(sql, [
      Number(id),
    ]);
    if (result.rows.length === 0) return null;
    return mapProvinceSnakeToCamel(result.rows[0]);
  }

  async _getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetProvinceByPointCoordinatesOptions,
  ): Promise<Province | null> {
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
    const result = await client.queryObject<ProvinceSnakeCased>(
      sql,
      coordinates,
    );
    if (result.rows.length === 0) return null;
    return mapProvinceSnakeToCamel(result.rows[0]);
  }
}

let _instance: ProvincePostgresQueries | null = null;

export function injectProvincePostgresQueries(
  config: MadaAdmConfigValues,
  db: PostgresDbConnection,
  pgSchema?: string,
): ProvincePostgresQueries {
  return _instance ??
    (_instance = new ProvincePostgresQueries(config, db, pgSchema));
}
