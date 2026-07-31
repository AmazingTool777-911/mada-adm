import {
  ADM_ENTITIES_UNION_TARGET_COLUMN_NAME,
  DbType,
} from "@scope/consts/db";
import {
  ADM_LEVEL_CODES_INDEXED,
  ADM_LEVEL_INDEX_BY_CODE,
  ADM_LEVEL_TITLE_BY_CODE,
  AdmLevelCode,
} from "@scope/consts/models";
import type {
  DbTransactionContext,
  MongoDbTransactionContext,
  MySQLTransactionContext,
  PostgresTransactionContext,
  SQLiteTransactionContext,
} from "@scope/types/db";
import type { MadaAdmConfigValues } from "@scope/types/models";
import { prefixWithCamelCase, prefixWithSnakeCase } from "@scope/utils/string";

/**
 * Ensures the given transaction context is a PostgresTransactionContext.
 * Throws an error if the context is present but has a different database type.
 *
 * @param transactionContext - The database transaction context to validate.
 * @returns True if the transaction context is a PostgresTransactionContext.
 * @throws Error if the transaction context exists but is not for a Postgres database.
 */
export function ensureIsPostgresDbTransactionCtx(
  transactionContext?: DbTransactionContext,
): transactionContext is PostgresTransactionContext {
  if (transactionContext) {
    if (transactionContext.dbType !== DbType.Postgres) {
      throw new Error(
        `Transaction context type (${transactionContext.dbType}) does not match database type (${DbType.Postgres})`,
      );
    }
    return true;
  }
  return false;
}

/**
 * Ensures the given transaction context is a SQLiteTransactionContext.
 * Throws an error if the context is present but has a different database type.
 *
 * @param transactionContext - The database transaction context to validate.
 * @returns True if the transaction context is a SQLiteTransactionContext.
 * @throws Error if the transaction context exists but is not for a SQLite database.
 */
export function ensureIsSqliteDbTransactionCtx(
  transactionContext?: DbTransactionContext,
): transactionContext is SQLiteTransactionContext {
  if (transactionContext) {
    if (transactionContext.dbType !== DbType.SQLite) {
      throw new Error(
        `Transaction context type (${transactionContext.dbType}) does not match database type (${DbType.SQLite})`,
      );
    }
    return true;
  }
  return false;
}

/**
 * Ensures the given transaction context is a MySQLTransactionContext.
 * Throws an error if the context is present but has a different database type.
 *
 * @param transactionContext - The database transaction context to validate.
 * @returns True if the transaction context is a MySQLTransactionContext.
 * @throws Error if the transaction context exists but is not for a MySQL database.
 */
export function ensureIsMySQLDbTransactionCtx(
  transactionContext?: DbTransactionContext,
): transactionContext is MySQLTransactionContext {
  if (transactionContext) {
    if (transactionContext.dbType !== DbType.MySQL) {
      throw new Error(
        `Transaction context type (${transactionContext.dbType}) does not match database type (${DbType.MySQL})`,
      );
    }
    return true;
  }
  return false;
}

/**
 * Ensures the given transaction context is a MongoDbTransactionContext.
 * Throws an error if the context is present but has a different database type.
 *
 * @param transactionContext - The database transaction context to validate.
 * @returns True if the transaction context is a MongoDbTransactionContext.
 * @throws Error if the transaction context exists but is not for a MongoDB database.
 */
export function ensureIsMongoDbTransactionCtx(
  transactionContext?: DbTransactionContext,
): transactionContext is MongoDbTransactionContext {
  if (transactionContext) {
    if (transactionContext.dbType !== DbType.MongoDB) {
      throw new Error(
        `Transaction context type (${transactionContext.dbType}) does not match database type (${DbType.MongoDB})`,
      );
    }
    return true;
  }
  return false;
}

/**
 * Options controlling which columns are included in the result of {@link getAdmTableColumns}.
 */
export type GetAdmTableColumnsOptions = {
  /**
   * When `true`, the geojson field is excluded from the returned column list
   * even when the config declares `hasGeojson: true`.
   */
  excludeGeojson?: boolean;
  /**
   * When provided, prefix the columns with the given table name,
   * returning `<tableName>.<column>`.
   */
  withTableName?: string;
};

/**
 * Returns the ordered list of columns (or field names) for an ADM level table
 * based on the given configuration and target database type.
 *
 * For SQL databases (Postgres, MySQL, SQLite), column names are snake_case and
 * the geojson column is expressed using the database-specific spatial function
 * that serialises the geometry back to a GeoJSON string.
 * For MongoDB, field names match the camelCase document properties — no
 * wrapping function is applied to the geojson field.
 *
 * The set of columns included respects all config flags:
 * - `hasGeojson` / `options.excludeGeojson` — controls the geojson column.
 * - `hasAdmLevel` — controls the adm_level / admLevel column.
 * - `isProvinceRepeated` — controls the province name column on District/Commune/Fokontany.
 * - `isProvinceFkRepeated` — controls the province_id / provinceId FK column on District/Commune/Fokontany.
 * - `isFkRepeated` — controls extra ancestor FK columns (region_id on Commune, region_id/district_id on Fokontany).
 *
 * @param admLevelCode - The administrative level whose columns are needed.
 * @param config - The ADM configuration values that drive column inclusion.
 * @param dbType - The target database type, used to select the correct geojson expression.
 * @param options - Optional flags that further filter the returned columns.
 * @returns An array of column strings ready to use in a SELECT clause (SQL) or
 *          as field-name references (MongoDB).
 */
export function getAdmTableColumns(
  admLevelCode: AdmLevelCode,
  config: MadaAdmConfigValues,
  dbType: DbType,
  options?: GetAdmTableColumnsOptions,
): string[] {
  const admLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(admLevelCode)!;
  const admLevelIndex = ADM_LEVEL_INDEX_BY_CODE.get(admLevelCode)!;
  const isMongo = dbType === DbType.MongoDB;

  // Naming helpers: column names differ by DB family (snake_case for SQL, camelCase for Mongo).
  const fkSuffix = isMongo ? "Id" : "_id";
  const admLevelCol = isMongo ? "admLevel" : "adm_level";
  const createdAtCol = isMongo ? "createdAt" : "created_at";
  const updatedAtCol = isMongo ? "updatedAt" : "updated_at";

  // ── scalar columns ───────────────────────────────────────────────────────

  // id (SQL only — Mongo uses _id implicitly)
  const columns: string[] = isMongo ? [] : ["id"];

  // The name column for this ADM level (e.g. "province", "region", …)
  // — identical in both SQL and MongoDB (single lowercase word)
  columns.push(admLevelTitle);

  // Ancestor name columns (each level includes its parents' names)
  const regionIndex = ADM_LEVEL_INDEX_BY_CODE.get(AdmLevelCode.REGION)!;
  const provinceIndex = ADM_LEVEL_INDEX_BY_CODE.get(AdmLevelCode.PROVINCE)!;

  // Province name — always present on REGION; conditional on lower levels
  if (admLevelIndex > provinceIndex) {
    const isLowerThanRegion = admLevelIndex > regionIndex;
    if (!isLowerThanRegion) {
      // REGION always carries province
      columns.push("province");
    } else {
      // DISTRICT / COMMUNE / FOKONTANY: only if isProvinceRepeated
      if (config.isProvinceRepeated) {
        columns.push("province");
      }
    }
  }

  // Intermediate ancestor name columns for deeper levels
  if (admLevelIndex > regionIndex) {
    for (let i = regionIndex; i < admLevelIndex - 1; i++) {
      const ancestorTitle = ADM_LEVEL_TITLE_BY_CODE.get(
        ADM_LEVEL_CODES_INDEXED[i],
      )!;
      columns.push(ancestorTitle);
    }
    // Direct parent name is always included
    const parentTitle = ADM_LEVEL_TITLE_BY_CODE.get(
      ADM_LEVEL_CODES_INDEXED[admLevelIndex - 1],
    )!;
    columns.push(parentTitle);
  }

  // ── FK columns ───────────────────────────────────────────────────────────

  // Direct parent FK (always present except for PROVINCE which has no parent)
  if (admLevelIndex > provinceIndex) {
    const directParentTitle = ADM_LEVEL_TITLE_BY_CODE.get(
      ADM_LEVEL_CODES_INDEXED[admLevelIndex - 1],
    )!;
    columns.push(`${directParentTitle}${fkSuffix}`);
  }

  // Province FK — only on sub-region levels when isProvinceFkRepeated
  if (admLevelIndex > regionIndex && config.isProvinceFkRepeated) {
    columns.push(`province${fkSuffix}`);
  }

  // Extra ancestor FKs governed by isFkRepeated
  if (config.isFkRepeated) {
    // COMMUNE: also carries region FK
    if (admLevelCode === AdmLevelCode.COMMUNE) {
      columns.push(`region${fkSuffix}`);
    }
    // FOKONTANY: also carries district and region FKs
    if (admLevelCode === AdmLevelCode.FOKONTANY) {
      columns.push(`district${fkSuffix}`);
      columns.push(`region${fkSuffix}`);
    }
  }

  // ── optional system columns ───────────────────────────────────────────────

  if (config.hasAdmLevel) {
    columns.push(admLevelCol);
  }

  // ── geojson ───────────────────────────────────────────────────────────────

  const includeGeojson = config.hasGeojson && !options?.excludeGeojson;
  if (includeGeojson) {
    const tPrefix = options?.withTableName ? `${options.withTableName}.` : "";
    switch (dbType) {
      case DbType.MySQL:
        columns.push(`ST_AsGeoJSON(${tPrefix}geojson) as geojson`);
        break;
      case DbType.SQLite:
        columns.push(`AsGeoJSON(${tPrefix}geojson) as geojson`);
        break;
      case DbType.Postgres:
        columns.push(`ST_AsGeoJSON(${tPrefix}geojson) as geojson`);
        break;
      case DbType.MongoDB:
        columns.push("geojson");
        break;
    }
  }

  // ── timestamp columns ────────────────────────────────────────────────────
  // All databases store timestamps; SQL uses snake_case, MongoDB uses camelCase.
  columns.push(createdAtCol);
  columns.push(updatedAtCol);

  if (options?.withTableName) {
    const prefix = `${options.withTableName}.`;
    return columns.map((col) => {
      if (col.toLowerCase().includes(" as ")) {
        return col;
      }
      return `${prefix}${col}`;
    });
  }

  return columns;
}

/**
 * Gets the final table name of an ADM table considering its ADM level, its mada ADM config, and its DB type.
 * @param admLevel - The ADM level
 * @param config - The mada ADM config
 * @param dbType - The DB type
 * @returns The computed table name
 */
export function getAdmTableName(
  admLevel: AdmLevelCode,
  config: MadaAdmConfigValues,
  dbType: DbType,
): string {
  const baseName = `${ADM_LEVEL_TITLE_BY_CODE.get(admLevel)!}s`;
  return dbType === DbType.MongoDB
    ? prefixWithCamelCase(config.tablesPrefix, baseName)
    : prefixWithSnakeCase(config.tablesPrefix, baseName);
}

export type GetAdmEntityUnionSetColumnsColumnData = {
  alias?: string | number | null;
  cast?: "id" | "text";
  name: string;
};

export function getAdmEntityUnionSetColumns(
  admLevel: AdmLevelCode,
  config: MadaAdmConfigValues,
  dbType: DbType,
): GetAdmEntityUnionSetColumnsColumnData[] {
  const admLevelIndex = ADM_LEVEL_INDEX_BY_CODE.get(admLevel)!;
  const admLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(admLevel)!;
  const useCamelCase = dbType === DbType.MongoDB;
  const cols: GetAdmEntityUnionSetColumnsColumnData[] = [
    { name: dbType === DbType.MongoDB ? "_id" : "id" },
    { name: useCamelCase ? "createdAt" : "created_at" },
    { name: useCamelCase ? "updatedAt" : "updated_at" },
  ];
  const admLevelColName = useCamelCase ? "admLevel" : "adm_level";
  const admLevelCol = config.hasAdmLevel ? { name: admLevelColName } : {
    name: admLevelColName,
    alias: admLevelIndex,
  };
  cols.push(admLevelCol);
  cols.push({
    name: ADM_ENTITIES_UNION_TARGET_COLUMN_NAME,
    alias: admLevelTitle,
    cast: "text",
  });
  for (let i = 0; i < ADM_LEVEL_CODES_INDEXED.length; i++) {
    const currentAdmLevel = ADM_LEVEL_CODES_INDEXED[i];
    const currentAdmLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(currentAdmLevel)!;
    const currentAdmLevelAsFkName = currentAdmLevelTitle +
      (useCamelCase ? "Id" : "_id");
    if (i === admLevelIndex) {
      cols.push({ name: currentAdmLevelTitle });
      cols.push({ name: currentAdmLevelAsFkName, alias: null, cast: "id" });
    } else if (i < admLevelIndex) {
      if (i === (admLevelIndex - 1)) {
        cols.push({ name: currentAdmLevelTitle });
        cols.push({
          name: currentAdmLevelAsFkName,
        });
      } else if (i === 0) {
        const provinceTitle = ADM_LEVEL_TITLE_BY_CODE.get(
          AdmLevelCode.PROVINCE,
        )!;
        cols.push(
          config.isProvinceRepeated
            ? { name: provinceTitle }
            : { alias: null, name: provinceTitle, cast: "text" },
        );
        const provinceColFkName = provinceTitle +
          (useCamelCase ? "Id" : "_id");
        cols.push(
          config.isProvinceFkRepeated
            ? {
              name: provinceColFkName,
            }
            : { name: provinceColFkName, alias: null, cast: "id" },
        );
      } else {
        cols.push({ name: currentAdmLevelTitle });
        const colFkName = currentAdmLevelAsFkName;
        cols.push(
          config.isFkRepeated
            ? { name: colFkName }
            : { name: colFkName, alias: null, cast: "id" },
        );
      }
    } else {
      cols.push({ name: currentAdmLevelTitle, alias: null, cast: "text" });
      const colFkName = currentAdmLevelAsFkName;
      cols.push({ name: colFkName, alias: null, cast: "id" });
    }
  }
  return cols;
}
