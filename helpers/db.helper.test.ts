// deno-lint-ignore-file
import { assertEquals, assertThrows } from "@std/assert";

import { DbType } from "@scope/consts/db";
import { AdmLevelCode } from "@scope/consts/models";
import type {
  DbTransactionContext,
  MySQLTransactionContext,
  PostgresTransactionContext,
  SQLiteTransactionContext,
} from "@scope/types/db";
import type { MadaAdmConfigValues } from "@scope/types/models";

import {
  ensureIsMySQLDbTransactionCtx,
  ensureIsPostgresDbTransactionCtx,
  ensureIsSqliteDbTransactionCtx,
  getAdmTableColumns,
} from "./db.helper.ts";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Minimal config with all optional columns disabled. */
function baseConfig(
  overrides: Partial<MadaAdmConfigValues> = {},
): MadaAdmConfigValues {
  return {
    tablesPrefix: null,
    isFkRepeated: false,
    isProvinceRepeated: false,
    isProvinceFkRepeated: false,
    hasGeojson: false,
    hasAdmLevel: false,
    ...overrides,
  };
}

// ─── ensureIsPostgresDbTransactionCtx ────────────────────────────────────────

Deno.test("ensureIsPostgresDbTransactionCtx", async (t) => {
  await t.step("returns false if context is undefined", () => {
    assertEquals(ensureIsPostgresDbTransactionCtx(), false);
  });

  await t.step("returns true if context is Postgres", () => {
    const ctx = {
      dbType: DbType.Postgres,
      tx: {},
    } as PostgresTransactionContext;
    assertEquals(ensureIsPostgresDbTransactionCtx(ctx), true);
  });

  await t.step("throws if context is not Postgres", () => {
    const ctx = { dbType: DbType.SQLite } as unknown as DbTransactionContext;
    assertThrows(
      () => ensureIsPostgresDbTransactionCtx(ctx),
      Error,
      `Transaction context type (${DbType.SQLite}) does not match database type (${DbType.Postgres})`,
    );
  });
});

// ─── ensureIsSqliteDbTransactionCtx ─────────────────────────────────────────

Deno.test("ensureIsSqliteDbTransactionCtx", async (t) => {
  await t.step("returns false if context is undefined", () => {
    assertEquals(ensureIsSqliteDbTransactionCtx(), false);
  });

  await t.step("returns true if context is SQLite", () => {
    const ctx = {
      dbType: DbType.SQLite,
    } as SQLiteTransactionContext;
    assertEquals(ensureIsSqliteDbTransactionCtx(ctx), true);
  });

  await t.step("throws if context is not SQLite", () => {
    const ctx = { dbType: DbType.Postgres } as unknown as DbTransactionContext;
    assertThrows(
      () => ensureIsSqliteDbTransactionCtx(ctx),
      Error,
      `Transaction context type (${DbType.Postgres}) does not match database type (${DbType.SQLite})`,
    );
  });
});

// ─── ensureIsMySQLDbTransactionCtx ───────────────────────────────────────────

Deno.test("ensureIsMySQLDbTransactionCtx", async (t) => {
  await t.step("returns false if context is undefined", () => {
    assertEquals(ensureIsMySQLDbTransactionCtx(), false);
  });

  await t.step("returns true if context is MySQL", () => {
    const ctx = {
      dbType: DbType.MySQL,
      connection: {},
    } as unknown as MySQLTransactionContext;
    assertEquals(ensureIsMySQLDbTransactionCtx(ctx), true);
  });

  await t.step("throws if context is not MySQL", () => {
    const ctx = { dbType: DbType.SQLite } as unknown as DbTransactionContext;
    assertThrows(
      () => ensureIsMySQLDbTransactionCtx(ctx),
      Error,
      `Transaction context type (${DbType.SQLite}) does not match database type (${DbType.MySQL})`,
    );
  });
});

// ─── getAdmTableColumns ──────────────────────────────────────────────────────

Deno.test("getAdmTableColumns — PROVINCE", async (t) => {
  await t.step("SQL: base config (no optional columns)", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.PROVINCE,
      baseConfig(),
      DbType.SQLite,
    );
    assertEquals(cols, ["id", "province", "created_at", "updated_at"]);
  });

  await t.step("SQL: with adm_level and geojson (SQLite function)", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.PROVINCE,
      baseConfig({ hasGeojson: true, hasAdmLevel: true }),
      DbType.SQLite,
    );
    assertEquals(cols, [
      "id",
      "province",
      "adm_level",
      "AsGeoJSON(geojson) as geojson",
      "created_at",
      "updated_at",
    ]);
  });

  await t.step("SQL: geojson uses ST_AsGeoJSON for MySQL", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.PROVINCE,
      baseConfig({ hasGeojson: true }),
      DbType.MySQL,
    );
    assertEquals(cols, [
      "id",
      "province",
      "ST_AsGeoJSON(geojson) as geojson",
      "created_at",
      "updated_at",
    ]);
  });

  await t.step("SQL: geojson uses ST_AsGeoJSON for Postgres", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.PROVINCE,
      baseConfig({ hasGeojson: true }),
      DbType.Postgres,
    );
    assertEquals(cols, [
      "id",
      "province",
      "ST_AsGeoJSON(geojson) as geojson",
      "created_at",
      "updated_at",
    ]);
  });

  await t.step("MongoDB: base config — no id, no timestamps", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.PROVINCE,
      baseConfig(),
      DbType.MongoDB,
    );
    assertEquals(cols, ["province", "createdAt", "updatedAt"]);
  });

  await t.step("MongoDB: with geojson — plain field name, no function", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.PROVINCE,
      baseConfig({ hasGeojson: true }),
      DbType.MongoDB,
    );
    assertEquals(cols, ["province", "geojson", "createdAt", "updatedAt"]);
  });

  await t.step(
    "excludeGeojson suppresses geojson even when hasGeojson=true",
    () => {
      const cols = getAdmTableColumns(
        AdmLevelCode.PROVINCE,
        baseConfig({ hasGeojson: true }),
        DbType.SQLite,
        { excludeGeojson: true },
      );
      assertEquals(cols, ["id", "province", "created_at", "updated_at"]);
    },
  );
});

Deno.test("getAdmTableColumns — REGION", async (t) => {
  await t.step(
    "SQL: base config — always carries province name and province_id",
    () => {
      const cols = getAdmTableColumns(
        AdmLevelCode.REGION,
        baseConfig(),
        DbType.SQLite,
      );
      assertEquals(cols, [
        "id",
        "region",
        "province",
        "province_id",
        "created_at",
        "updated_at",
      ]);
    },
  );

  await t.step(
    "SQL: isProvinceFkRepeated has no extra effect at REGION level",
    () => {
      // province_id is already the direct parent FK on REGION —
      // isProvinceFkRepeated only adds an extra province_id on District/Commune/Fokontany
      const cols = getAdmTableColumns(
        AdmLevelCode.REGION,
        baseConfig({ isProvinceFkRepeated: true }),
        DbType.SQLite,
      );
      assertEquals(cols, [
        "id",
        "region",
        "province",
        "province_id",
        "created_at",
        "updated_at",
      ]);
    },
  );

  await t.step("MongoDB: uses camelCase provinceId", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.REGION,
      baseConfig(),
      DbType.MongoDB,
    );
    assertEquals(cols, [
      "region",
      "province",
      "provinceId",
      "createdAt",
      "updatedAt",
    ]);
  });
});

Deno.test("getAdmTableColumns — DISTRICT", async (t) => {
  await t.step("SQL: base config — no province repetition", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.DISTRICT,
      baseConfig(),
      DbType.SQLite,
    );
    assertEquals(cols, [
      "id",
      "district",
      "region",
      "region_id",
      "created_at",
      "updated_at",
    ]);
  });

  await t.step("SQL: isProvinceRepeated adds province name", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.DISTRICT,
      baseConfig({ isProvinceRepeated: true }),
      DbType.SQLite,
    );
    assertEquals(cols, [
      "id",
      "district",
      "province",
      "region",
      "region_id",
      "created_at",
      "updated_at",
    ]);
  });

  await t.step("SQL: isProvinceFkRepeated adds province_id FK", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.DISTRICT,
      baseConfig({ isProvinceFkRepeated: true }),
      DbType.SQLite,
    );
    assertEquals(cols, [
      "id",
      "district",
      "region",
      "region_id",
      "province_id",
      "created_at",
      "updated_at",
    ]);
  });

  await t.step(
    "SQL: isFkRepeated has no extra effect at DISTRICT level",
    () => {
      // DISTRICT's only FK is region_id (direct parent); isFkRepeated adds extras
      // only for COMMUNE and FOKONTANY
      const cols = getAdmTableColumns(
        AdmLevelCode.DISTRICT,
        baseConfig({ isFkRepeated: true }),
        DbType.SQLite,
      );
      assertEquals(cols, [
        "id",
        "district",
        "region",
        "region_id",
        "created_at",
        "updated_at",
      ]);
    },
  );
});

Deno.test("getAdmTableColumns — COMMUNE", async (t) => {
  await t.step("SQL: base config", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.COMMUNE,
      baseConfig(),
      DbType.SQLite,
    );
    assertEquals(cols, [
      "id",
      "commune",
      "region",
      "district",
      "district_id",
      "created_at",
      "updated_at",
    ]);
  });

  await t.step("SQL: isFkRepeated adds region_id", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.COMMUNE,
      baseConfig({ isFkRepeated: true }),
      DbType.SQLite,
    );
    assertEquals(cols, [
      "id",
      "commune",
      "region",
      "district",
      "district_id",
      "region_id",
      "created_at",
      "updated_at",
    ]);
  });

  await t.step("SQL: all optional flags enabled (MySQL)", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.COMMUNE,
      baseConfig({
        isFkRepeated: true,
        isProvinceRepeated: true,
        isProvinceFkRepeated: true,
        hasGeojson: true,
        hasAdmLevel: true,
      }),
      DbType.MySQL,
    );
    assertEquals(cols, [
      "id",
      "commune",
      "province",
      "region",
      "district",
      "district_id",
      "province_id",
      "region_id",
      "adm_level",
      "ST_AsGeoJSON(geojson) as geojson",
      "created_at",
      "updated_at",
    ]);
  });

  await t.step("MongoDB: isFkRepeated uses camelCase regionId", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.COMMUNE,
      baseConfig({ isFkRepeated: true }),
      DbType.MongoDB,
    );
    assertEquals(cols, [
      "commune",
      "region",
      "district",
      "districtId",
      "regionId",
      "createdAt",
      "updatedAt",
    ]);
  });
});

Deno.test("getAdmTableColumns — FOKONTANY", async (t) => {
  await t.step("SQL: base config", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.FOKONTANY,
      baseConfig(),
      DbType.SQLite,
    );
    assertEquals(cols, [
      "id",
      "fokontany",
      "region",
      "district",
      "commune",
      "commune_id",
      "created_at",
      "updated_at",
    ]);
  });

  await t.step("SQL: isFkRepeated adds district_id and region_id", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.FOKONTANY,
      baseConfig({ isFkRepeated: true }),
      DbType.SQLite,
    );
    assertEquals(cols, [
      "id",
      "fokontany",
      "region",
      "district",
      "commune",
      "commune_id",
      "district_id",
      "region_id",
      "created_at",
      "updated_at",
    ]);
  });

  await t.step("SQL: all optional flags enabled (Postgres)", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.FOKONTANY,
      baseConfig({
        isFkRepeated: true,
        isProvinceRepeated: true,
        isProvinceFkRepeated: true,
        hasGeojson: true,
        hasAdmLevel: true,
      }),
      DbType.Postgres,
    );
    assertEquals(cols, [
      "id",
      "fokontany",
      "province",
      "region",
      "district",
      "commune",
      "commune_id",
      "province_id",
      "district_id",
      "region_id",
      "adm_level",
      "ST_AsGeoJSON(geojson) as geojson",
      "created_at",
      "updated_at",
    ]);
  });

  await t.step("MongoDB: isFkRepeated, no id", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.FOKONTANY,
      baseConfig({ isFkRepeated: true, hasGeojson: true }),
      DbType.MongoDB,
    );
    assertEquals(cols, [
      "fokontany",
      "region",
      "district",
      "commune",
      "communeId",
      "districtId",
      "regionId",
      "geojson",
      "createdAt",
      "updatedAt",
    ]);
  });
});

Deno.test("getAdmTableColumns — withTableName", async (t) => {
  await t.step(
    "SQL: prefixes standard columns and wraps geojson correctly (SQLite)",
    () => {
      const cols = getAdmTableColumns(
        AdmLevelCode.PROVINCE,
        baseConfig({ hasGeojson: true, hasAdmLevel: true }),
        DbType.SQLite,
        { withTableName: "p" },
      );
      assertEquals(cols, [
        "p.id",
        "p.province",
        "p.adm_level",
        "AsGeoJSON(p.geojson) as geojson",
        "p.created_at",
        "p.updated_at",
      ]);
    },
  );

  await t.step("SQL: wraps geojson correctly for Postgres", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.PROVINCE,
      baseConfig({ hasGeojson: true }),
      DbType.Postgres,
      { withTableName: "prv" },
    );
    assertEquals(cols, [
      "prv.id",
      "prv.province",
      "ST_AsGeoJSON(prv.geojson) as geojson",
      "prv.created_at",
      "prv.updated_at",
    ]);
  });

  await t.step("MongoDB: prefixes standard columns including geojson", () => {
    const cols = getAdmTableColumns(
      AdmLevelCode.REGION,
      baseConfig({ hasGeojson: true }),
      DbType.MongoDB,
      { withTableName: "r" },
    );
    assertEquals(cols, [
      "r.region",
      "r.province",
      "r.provinceId",
      "r.geojson",
      "r.createdAt",
      "r.updatedAt",
    ]);
  });
});
