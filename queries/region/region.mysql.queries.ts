import type {
  EntityId,
  MadaAdmConfigValues,
  Region,
  RegionSnakeCased,
} from "@scope/types/models";
import type { MySQLDbConnection } from "@scope/adapters/mysql";
import { mapRegionSnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import { AdmLevelCode } from "@scope/consts/models";
import type { GetRegionByIdOptions, RegionQueries } from "../queries.d.ts";
import { AdmTableBaseQueries } from "../base/adm-table.base.queries.ts";

export class RegionMySQLQueries extends AdmTableBaseQueries
  implements RegionQueries {
  #db!: MySQLDbConnection;

  constructor(
    config: MadaAdmConfigValues,
    db: MySQLDbConnection,
  ) {
    super(config, DbType.MySQL, AdmLevelCode.REGION);
    this.#db = db;
  }

  async getAll(): Promise<Region[]> {
    const columns = this.getTableColunms({
      excludeGeojson: true,
    });
    const sql = `
      SELECT ${columns.join(", ")}
      FROM ${this.tableName}
    `;
    const result = await this.#db.pool.query(
      sql,
    );
    return (result[0] as RegionSnakeCased[]).map(mapRegionSnakeToCamel);
  }

  async getById(
    id: EntityId,
    options?: GetRegionByIdOptions,
  ): Promise<Region | null> {
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
    const rows = results[0] as RegionSnakeCased[];
    if (rows.length === 0) return null;
    return mapRegionSnakeToCamel(rows[0]);
  }
}

let _instance: RegionMySQLQueries | null = null;

export function injectRegionMySQLQueries(
  config: MadaAdmConfigValues,
  db: MySQLDbConnection,
): RegionMySQLQueries {
  return _instance ?? (_instance = new RegionMySQLQueries(config, db));
}
