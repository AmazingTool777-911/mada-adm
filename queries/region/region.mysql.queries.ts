import type {
  MadaAdmConfigValues,
  Region,
  RegionSnakeCased,
} from "@scope/types/models";
import type { MySQLDbConnection } from "@scope/adapters/mysql";
import { mapRegionSnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import { AdmLevelCode } from "@scope/consts/models";
import type { RegionQueries } from "../queries.d.ts";
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
    const columns = this.getColunmsWithoutGeojson({
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
}

let _instance: RegionMySQLQueries | null = null;

export function injectRegionMySQLQueries(
  config: MadaAdmConfigValues,
  db: MySQLDbConnection,
): RegionMySQLQueries {
  return _instance ?? (_instance = new RegionMySQLQueries(config, db));
}
