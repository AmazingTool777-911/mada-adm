import type {
  EntityId,
  MadaAdmConfigValues,
  Province,
  ProvinceSnakeCased,
} from "@scope/types/models";
import type { MySQLDbConnection } from "@scope/adapters/mysql";
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

export class ProvinceMySQLQueries extends ProvinceBaseQueries
  implements ProvinceQueries {
  #db!: MySQLDbConnection;

  constructor(
    config: MadaAdmConfigValues,
    db: MySQLDbConnection,
  ) {
    super(config, DbType.MySQL);
    this.#db = db;
  }

  async getAll(): Promise<Province[]> {
    const columns = this.getTableColunms({
      excludeGeojson: true,
    });
    const sql = `
      SELECT ${columns.join(", ")}
      FROM ${this.tableName}
    `;
    const results = await this.#db.pool.query(
      sql,
    );
    return (results[0] as ProvinceSnakeCased[]).map(mapProvinceSnakeToCamel);
  }

  async getById(
    id: EntityId,
    options?: GetProvinceByIdOptions,
  ): Promise<Province | null> {
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
    const rows = results[0] as ProvinceSnakeCased[];
    if (rows.length === 0) return null;
    return mapProvinceSnakeToCamel(rows[0]);
  }

  async _getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetProvinceByPointCoordinatesOptions,
  ): Promise<Province | null> {
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
    const rows = results[0] as ProvinceSnakeCased[];
    if (rows.length === 0) return null;
    return mapProvinceSnakeToCamel(rows[0]);
  }
}

let _instance: ProvinceMySQLQueries | null = null;

export function injectProvinceMySQLQueries(
  config: MadaAdmConfigValues,
  db: MySQLDbConnection,
): ProvinceMySQLQueries {
  return _instance ?? (_instance = new ProvinceMySQLQueries(config, db));
}
