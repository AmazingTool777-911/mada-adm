import type {
  MadaAdmConfigValues,
  Region,
  RegionSnakeCased,
} from "@scope/types/models";
import type { SqliteDbConnection } from "@scope/adapters/sqlite";
import { mapRegionSnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import { AdmLevelCode } from "@scope/consts/models";
import type { RegionQueries } from "../queries.d.ts";
import { AdmTableBaseQueries } from "../base/adm-table.base.queries.ts";

export class RegionSqliteQueries extends AdmTableBaseQueries
  implements RegionQueries {
  #db!: SqliteDbConnection;

  constructor(
    config: MadaAdmConfigValues,
    db: SqliteDbConnection,
  ) {
    super(config, DbType.SQLite, AdmLevelCode.REGION);
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
}

let _instance: RegionSqliteQueries | null = null;

export function injectRegionSqliteQueries(
  config: MadaAdmConfigValues,
  db: SqliteDbConnection,
): RegionSqliteQueries {
  return _instance ?? (_instance = new RegionSqliteQueries(config, db));
}
