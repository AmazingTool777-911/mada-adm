import type {
  MadaAdmConfigValues,
  Province,
  ProvinceSnakeCased,
} from "@scope/types/models";
import type { SqliteDbConnection } from "@scope/adapters/sqlite";
import { mapProvinceSnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import { AdmLevelCode } from "@scope/consts/models";
import type { ProvinceQueries } from "@scope/queries/types";
import { AdmTableBaseQueries } from "../base/adm-table.base.queries.ts";

export class ProvinceSqliteQueries extends AdmTableBaseQueries
  implements ProvinceQueries {
  #db!: SqliteDbConnection;

  constructor(
    config: MadaAdmConfigValues,
    db: SqliteDbConnection,
  ) {
    super(config, DbType.Postgres, AdmLevelCode.PROVINCE);
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
}

let _instance: ProvinceSqliteQueries | null = null;

export function injectProvinceSqliteQueries(
  config: MadaAdmConfigValues,
  db: SqliteDbConnection,
): ProvinceSqliteQueries {
  return _instance ?? (_instance = new ProvinceSqliteQueries(config, db));
}
