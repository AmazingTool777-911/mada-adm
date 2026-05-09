import { StringUtils } from "@scope/utils";
import type { MadaAdmConfigValues } from "@scope/types/models";
import type { PostgresDbConnection } from "../postgres-db.connection.ts";
import type {
  AdmAttributes,
  AdmEntity,
  AdmRecord,
  CommuneSnakeCased,
  DistrictSnakeCased,
  FokontanySnakeCased,
  ProvinceSnakeCased,
  RegionSnakeCased,
} from "@scope/types/models";
import type {
  DbTransactionContext,
  DMLCreateManyResult,
  DMLUpdateResult,
  EntityId,
} from "@scope/types/db";
import { DbHelper } from "@scope/helpers";
import {
  ADM_LEVEL_CODES_INDEXED,
  ADM_LEVEL_INDEX_BY_CODE,
  ADM_LEVEL_TITLE_BY_CODE,
  AdmLevelCode,
} from "@scope/consts/models";
import {
  isGeoJSONGeometry,
  mapCommuneSnakeToCamel,
  mapDistrictSnakeToCamel,
  mapFokontanySnakeToCamel,
  mapProvinceSnakeToCamel,
  mapRegionSnakeToCamel,
} from "@scope/helpers/models";

/**
 * Abstract base class for ADM Data Manipulation Layer (DML) implementations
 * using PostgreSQL.
 */
export abstract class BaseAdmPostgresTableDML {
  constructor(
    protected config: MadaAdmConfigValues,
    protected db: PostgresDbConnection,
    protected schema: string = "public",
  ) {}

  /**
   * Generates the fully qualified physical database table name by applying
   * the prefix from the configuration and prepending the schema name.
   *
   * @param baseName - The base name of the administrative table (e.g., 'regions').
   * @returns The fully qualified table name (e.g., 'public.mada_regions').
   */
  protected getTableName(baseName: string): string {
    const tableName = StringUtils.prefixWithSnakeCase(
      this.config.tablesPrefix,
      baseName,
    );
    return `${this.schema}.${tableName}`;
  }

  /**
   * Fetches multiple administrative entities matching a list of attribute sets.
   *
   * @param admLevel - The administrative level to query.
   * @param attributesValues - A list of attribute sets to match against.
   * @param mapper - Maps a raw snake-cased row to a camel-cased entity.
   * @param lowercaseAttribute - Optional column name to compare case-insensitively.
   * @param transactionContext - Optional database transaction context.
   * @returns An array of mapped administrative entities.
   */
  protected async _getManyByAttributes(
    admLevel: AdmLevelCode,
    attributesValues: AdmAttributes[],
    transactionContext?: DbTransactionContext,
  ): Promise<AdmEntity[]> {
    if (attributesValues.length === 0) return [];
    const admLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(admLevel)!;
    const tableName = this.getTableName(`${admLevelTitle}s`);
    const attributes = Object.keys(attributesValues[0]);
    const sql = `
      SELECT t.*
      FROM (
        SELECT ${
      attributes.map((attr) => `(row->>'${attr}') as ${attr}`).join(", ")
    }
        FROM UNNEST($1::jsonb[]) AS row
      ) AS inputs
      CROSS JOIN LATERAL (
        SELECT ${tableName}.*
        FROM ${tableName}
        WHERE ${
      attributes.map((attr) => {
        return `${tableName}.${attr} = inputs.${attr}`;
      }).join(" AND ")
    }
      ) AS t;
    `;
    const isTx = DbHelper.ensureIsPostgresDbTransactionCtx(transactionContext);
    const client = isTx ? null : await this.db.pool.connect();
    const executor = isTx ? transactionContext.tx : client!;
    try {
      const result = await executor.queryObject<unknown>(sql, [
        attributesValues.map((v) => JSON.stringify(v)),
      ]);
      return result.rows.map((r) => {
        switch (admLevel) {
          case AdmLevelCode.PROVINCE:
            return mapProvinceSnakeToCamel(r as ProvinceSnakeCased);
          case AdmLevelCode.REGION:
            return mapRegionSnakeToCamel(r as RegionSnakeCased);
          case AdmLevelCode.DISTRICT:
            return mapDistrictSnakeToCamel(r as DistrictSnakeCased);
          case AdmLevelCode.COMMUNE:
            return mapCommuneSnakeToCamel(r as CommuneSnakeCased);
          case AdmLevelCode.FOKONTANY:
            return mapFokontanySnakeToCamel(r as FokontanySnakeCased);
          default:
            throw new Error(
              `Unknown ADM level when getting ${admLevelTitle}: ${admLevel} by attributes`,
            );
        }
      });
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Updates the GeoJSON field of an administrative entity identified by its attributes.
   *
   * @param admLevel - The administrative level of the entity.
   * @param identifiers - The attributes used to identify the entity.
   * @param geojson - The new GeoJSON string to set.
   * @param lowercaseAttribute - Optional column name to compare case-insensitively.
   * @param transactionContext - Optional database transaction context.
   * @returns An object containing the number of affected rows.
   */
  protected async _updateGeojsonByIdentifiers(
    admLevel: AdmLevelCode,
    identifiers: AdmAttributes,
    geojson: string,
    transactionContext?: DbTransactionContext,
  ): Promise<DMLUpdateResult> {
    const admLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(admLevel)!;
    const tableName = this.getTableName(`${admLevelTitle}s`);
    const attributes = Object.keys(identifiers);
    const sql = `
      UPDATE ${tableName}
      SET 
        geojson = ST_GeomFromGeoJSON($1),
        updated_at = NOW()
      WHERE ${
      attributes.map((attr, i) => {
        return `${attr} = $${i + 2}`;
      }).join(" AND ")
    }
    `;
    const isTx = DbHelper.ensureIsPostgresDbTransactionCtx(transactionContext);
    const client = isTx ? null : await this.db.pool.connect();
    const executor = isTx ? transactionContext.tx : client!;
    try {
      const result = await executor.queryObject(sql, [
        geojson,
        ...Object.values(identifiers),
      ]);
      return { affectedRows: result.rowCount ?? 0 };
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Executes a batch insertion for the given administrative level.
   *
   * @param admLevel - The administrative level of the entities to insert.
   * @param records - The data records to insert.
   * @param transactionContext - Optional database transaction context.
   * @returns A promise resolving to the result of the batch insertion.
   */
  protected async _createMany(
    admLevel: AdmLevelCode,
    records: AdmRecord[],
    transactionContext?: DbTransactionContext,
  ): Promise<DMLCreateManyResult> {
    if (records.length === 0) return { insertedCount: 0 };
    const admLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(admLevel)!;
    const tableName = this.getTableName(`${admLevelTitle}s`);

    const columns = Object.keys(records[0]).filter((attr) => {
      if (attr === "geojson") return this.config.hasGeojson;
      if (attr === "adm_level") return this.config.hasAdmLevel;
      if (
        [AdmLevelCode.DISTRICT, AdmLevelCode.COMMUNE, AdmLevelCode.FOKONTANY]
          .includes(admLevel)
      ) {
        if (attr === "province") return this.config.isProvinceRepeated;
        if (attr === "provinceId") return this.config.isProvinceFkRepeated;
      }
      if (admLevel === AdmLevelCode.COMMUNE && attr === "regionId") {
        return this.config.isFkRepeated;
      }
      if (
        admLevel === AdmLevelCode.FOKONTANY &&
        ["regionId", "districtId"].includes(attr)
      ) return this.config.isFkRepeated;
      return true;
    });

    const values = records.map((r) =>
      columns.map((c) => {
        const value = r[c as keyof AdmRecord]!;
        if (isGeoJSONGeometry(value)) return JSON.stringify(value);
        return value;
      })
    );

    let argIndex = 1;
    const placeholders = values.map(() =>
      "(" + columns.map((c) =>
        c === "geojson"
          ? `ST_GeomFromGeoJSON($${argIndex++})`
          : `$${argIndex++}`
      ).join(", ") + ")"
    ).join(", ");

    const sql = `
      INSERT INTO ${tableName} (${
      columns.map((c) => StringUtils.camelToSnakeCase(c)).join(",")
    })
      VALUES ${placeholders};
    `;

    const isTx = DbHelper.ensureIsPostgresDbTransactionCtx(transactionContext);
    const client = isTx ? null : await this.db.pool.connect();
    const executor = isTx ? transactionContext.tx : client!;
    try {
      const res = await executor.queryObject<{ rowCount: number }>(
        sql,
        values.flat(),
      );
      return { insertedCount: res.rowCount ?? 0 };
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Deletes duplicate records from the given administrative level's table.
   *
   * @param admLevel - The administrative level of the table to deduplicate.
   * @param partitionKeys - The columns to use for identifying duplicates.
   */
  protected async _deleteDuplicates(
    admLevel: AdmLevelCode,
    transactionContext?: DbTransactionContext,
  ): Promise<void> {
    const admLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(admLevel)!;
    const tableName = this.getTableName(`${admLevelTitle}s`);
    const partitionKeys: string[] = [admLevelTitle];

    const regionAdmLevelIndex = ADM_LEVEL_INDEX_BY_CODE.get(
      AdmLevelCode.REGION,
    )!;
    if (ADM_LEVEL_INDEX_BY_CODE.get(admLevel)! > regionAdmLevelIndex) {
      const admLevelIndex = ADM_LEVEL_INDEX_BY_CODE.get(admLevel)!;
      for (let i = admLevelIndex - 1; i >= regionAdmLevelIndex; i--) {
        const parentAdmLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(
          ADM_LEVEL_CODES_INDEXED[i],
        )!;
        partitionKeys.push(parentAdmLevelTitle);
      }
    }

    const sql = `
      WITH ranked AS (
        SELECT id, 
          ROW_NUMBER() OVER (
            PARTITION BY ${partitionKeys.join(", ")}
            ORDER BY id ASC
          ) AS row_num
        FROM ${tableName}
      )
      DELETE FROM ${tableName}
      WHERE id IN (
        SELECT id FROM ranked WHERE row_num > 1
      );
    `;
    const isTx = DbHelper.ensureIsPostgresDbTransactionCtx(transactionContext);
    const client = isTx ? null : await this.db.pool.connect();
    const executor = isTx ? transactionContext.tx : client!;
    try {
      await executor.queryObject(sql);
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Fetches all rows from the given administrative level's table whose parent FK
   * matches any value in `parentsIds`.
   *
   * @param admLevel - The administrative level of the entities to retrieve.
   * @param parentsIds - The set of parent IDs to match.
   * @param transactionContext - Optional database transaction context.
   * @returns An array of mapped entities.
   */
  protected async _getManyByParentsIds(
    admLevel: AdmLevelCode,
    parentsIds: EntityId[],
    transactionContext?: DbTransactionContext,
  ): Promise<AdmEntity[]> {
    if (admLevel === AdmLevelCode.PROVINCE) {
      throw new Error(`There is no parent for province`);
    }
    if (parentsIds.length === 0) return [];

    const admLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(admLevel)!;
    const tableName = this.getTableName(`${admLevelTitle}s`);
    const parentIdColumn = `${ADM_LEVEL_TITLE_BY_CODE.get(
      ADM_LEVEL_CODES_INDEXED[ADM_LEVEL_INDEX_BY_CODE.get(admLevel)! - 1],
    )!}_id`;
    const sql = `
      SELECT ${tableName}.*
      FROM ${tableName}
      WHERE ${parentIdColumn} = ANY($1);
    `;
    const isTx = DbHelper.ensureIsPostgresDbTransactionCtx(transactionContext);
    const client = isTx ? null : await this.db.pool.connect();
    const executor = isTx ? transactionContext.tx : client!;
    try {
      const result = await executor.queryObject<unknown>(sql, [parentsIds]);
      return result.rows.map((r) => {
        switch (admLevel) {
          case AdmLevelCode.REGION:
            return mapRegionSnakeToCamel(r as RegionSnakeCased);
          case AdmLevelCode.DISTRICT:
            return mapDistrictSnakeToCamel(r as DistrictSnakeCased);
          case AdmLevelCode.COMMUNE:
            return mapCommuneSnakeToCamel(r as CommuneSnakeCased);
          case AdmLevelCode.FOKONTANY:
            return mapFokontanySnakeToCamel(r as FokontanySnakeCased);
          default:
            throw new Error(
              `Unknown ADM level when getting ${admLevelTitle}: ${admLevel} by parents ids`,
            );
        }
      });
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Updates the column `column` to `value` on every row in the given
   * administrative level's table whose `id` appears in `ids`.
   *
   * @param admLevel - The administrative level of the entities to update.
   * @param ids - The set of row IDs to target.
   * @param column - The column to set.
   * @param value - The new value for the column.
   * @param transactionContext - Optional database transaction context.
   * @returns An object containing the number of affected rows.
   */
  protected async _updateFieldByIds(
    admLevel: AdmLevelCode,
    ids: EntityId[],
    column: string,
    value: string,
    transactionContext?: DbTransactionContext,
  ): Promise<DMLUpdateResult> {
    if (ids.length === 0) return { affectedRows: 0 };
    const admLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(admLevel)!;
    const tableName = this.getTableName(`${admLevelTitle}s`);
    const sql = `
      UPDATE ${tableName}
      SET ${column} = $1
      WHERE id = ANY($2);
    `;
    const isTx = DbHelper.ensureIsPostgresDbTransactionCtx(transactionContext);
    const client = isTx ? null : await this.db.pool.connect();
    const executor = isTx ? transactionContext.tx : client!;
    try {
      const result = await executor.queryObject(sql, [value, ids]);
      return { affectedRows: result.rowCount ?? 0 };
    } finally {
      if (client) client.release();
    }
  }
}
