import type {
  MadaAdmConfigValues,
  Province,
  ProvinceSnakeCased,
} from "@scope/types/models";
import type { MySQLDbConnection } from "@scope/adapters/mysql";
import { mapProvinceSnakeToCamel } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import { AdmLevelCode } from "@scope/consts/models";
import type { ProvinceQueries } from "@scope/queries/types";
import { AdmTableBaseQueries } from "../base/adm-table.base.queries.ts";

export class ProvinceMySQLQueries extends AdmTableBaseQueries
  implements ProvinceQueries {
  #db!: MySQLDbConnection;

  constructor(
    config: MadaAdmConfigValues,
    db: MySQLDbConnection,
  ) {
    super(config, DbType.MySQL, AdmLevelCode.PROVINCE);
    this.#db = db;
  }

  async getAll(): Promise<Province[]> {
    const columns = this.getColunmsWithoutGeojson({
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
}

let _instance: ProvinceMySQLQueries | null = null;

export function injectProvinceMySQLQueries(
  config: MadaAdmConfigValues,
  db: MySQLDbConnection,
): ProvinceMySQLQueries {
  return _instance ?? (_instance = new ProvinceMySQLQueries(config, db));
}
