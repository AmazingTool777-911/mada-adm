import type {
  EntityId,
  MadaAdmConfigValues,
  Province,
  ProvinceSnakeCased,
} from "@scope/types/models";
import type { SqliteDbConnection } from "@scope/adapters/sqlite";
import { mapProvinceSnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type {
  GetProvinceByIdOptions,
  ProvinceQueries,
} from "@scope/queries/types";
import type {
  GetProvinceByPointCoordinatesOptions,
  PointCoordinates,
} from "../queries.d.ts";
import { ProvinceBaseQueries } from "../base/province.base.queries.ts";

export class ProvinceSqliteQueries extends ProvinceBaseQueries
  implements ProvinceQueries {
  #db!: SqliteDbConnection;

  constructor(
    config: MadaAdmConfigValues,
    db: SqliteDbConnection,
  ) {
    super(config, DbType.SQLite);
    this.#db = db;
  }

  getAll(): Province[] {
    const columns = this.getTableColunms({
      excludeGeojson: true,
    });
    const sql = `
      SELECT ${columns.join(", ")}
      FROM ${this.tableName}
    `;
    const rows = this.#db.client.prepare(sql).all() as ProvinceSnakeCased[];
    return rows.map(mapProvinceSnakeToCamel);
  }

  getById(id: EntityId, options?: GetProvinceByIdOptions): Province | null {
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
    ) as ProvinceSnakeCased[];
    if (rows.length === 0) return null;
    return mapProvinceSnakeToCamel(rows[0]);
  }

  _getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetProvinceByPointCoordinatesOptions,
  ): Province | null {
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
      .all(...coordinates) as ProvinceSnakeCased[];
    if (rows.length === 0) return null;
    return mapProvinceSnakeToCamel(rows[0]);
  }
}

let _instance: ProvinceSqliteQueries | null = null;

export function injectProvinceSqliteQueries(
  config: MadaAdmConfigValues,
  db: SqliteDbConnection,
): ProvinceSqliteQueries {
  return _instance ?? (_instance = new ProvinceSqliteQueries(config, db));
}
