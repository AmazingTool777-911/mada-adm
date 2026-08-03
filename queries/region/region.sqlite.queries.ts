import type {
  EntityId,
  MadaAdmConfigValues,
  Region,
  RegionSnakeCased,
} from "@scope/types/models";
import type { SqliteDbConnection } from "@scope/adapters/sqlite";
import { mapRegionSnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type { GetRegionByIdOptions, RegionQueries } from "../queries.d.ts";
import type {
  GetRegionByPointCoordinatesOptions,
  PointCoordinates,
} from "../queries.d.ts";
import { RegionBaseQueries } from "../base/region.base.queries.ts";

export class RegionSqliteQueries extends RegionBaseQueries
  implements RegionQueries {
  #db!: SqliteDbConnection;

  constructor(
    config: MadaAdmConfigValues,
    db: SqliteDbConnection,
  ) {
    super(config, DbType.SQLite);
    this.#db = db;
  }

  getAll(): Region[] {
    const columns = this.getTableColunms({
      excludeGeojson: true,
    });
    const sql = `
      SELECT ${columns.join(", ")}
      FROM ${this.tableName}
    `;
    const rows = this.#db.client.prepare(sql).all() as RegionSnakeCased[];
    return rows.map(mapRegionSnakeToCamel);
  }

  getById(id: EntityId, options?: GetRegionByIdOptions): Region | null {
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
    ) as RegionSnakeCased[];
    if (rows.length === 0) return null;
    return mapRegionSnakeToCamel(rows[0]);
  }

  _getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetRegionByPointCoordinatesOptions,
  ): Region | null {
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
      .all(...coordinates) as RegionSnakeCased[];
    if (rows.length === 0) return null;
    return mapRegionSnakeToCamel(rows[0]);
  }
}

let _instance: RegionSqliteQueries | null = null;

export function injectRegionSqliteQueries(
  config: MadaAdmConfigValues,
  db: SqliteDbConnection,
): RegionSqliteQueries {
  return _instance ?? (_instance = new RegionSqliteQueries(config, db));
}
