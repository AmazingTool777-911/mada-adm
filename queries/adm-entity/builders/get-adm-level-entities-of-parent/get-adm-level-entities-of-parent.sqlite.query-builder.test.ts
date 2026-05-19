import { assertEquals, assertThrows } from "@std/assert";

import { AdmLevelCode } from "@scope/consts/models";
import { DbType } from "@scope/consts/db";
import type { MadaAdmConfigValues } from "@scope/types/models";

import {
  GetAdmLevelEntitiesOfParentSqliteQueryBuilder,
} from "./get-adm-level-entities-of-parent.sqlite.query-builder.ts";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Collapses any run of whitespace to a single space and trims. */
function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

/** Minimal config — no optional columns, no prefix, no geojson. */
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

function makeBuilder(
  config: MadaAdmConfigValues = baseConfig(),
) {
  return new GetAdmLevelEntitiesOfParentSqliteQueryBuilder(config);
}

// ─── tests ───────────────────────────────────────────────────────────────────

Deno.test(
  "build — throws when parent level is at or below the target level",
  async (t) => {
    const builder = makeBuilder();

    await t.step("same level throws", () => {
      assertThrows(
        () =>
          builder.build(AdmLevelCode.REGION, {
            admLevel: AdmLevelCode.REGION,
            id: "r-1",
          }),
        Error,
        "Invalid parent level",
      );
    });

    await t.step("parent deeper than target throws", () => {
      assertThrows(
        () =>
          builder.build(AdmLevelCode.REGION, {
            admLevel: AdmLevelCode.DISTRICT,
            id: "d-1",
          }),
        Error,
        "Invalid parent level",
      );
    });
  },
);

Deno.test(
  "build — regions (ADM1) under province (ADM0), 1-level gap, no search, default limit = 10",
  () => {
    const builder = makeBuilder();
    const result = builder.build(AdmLevelCode.REGION, {
      admLevel: AdmLevelCode.PROVINCE,
      id: "prov-1",
    });

    assertEquals(result.dbType, DbType.SQLite);
    assertEquals(result.params, ["prov-1", 10]);

    const sql = normalizeSql(result.sqlTemplate);
    // The anchor sub-query selects only id from provinces
    assertEquals(
      sql.includes("SELECT id FROM provinces WHERE provinces.id = ? LIMIT ?"),
      true,
    );
    // The outer query selects all region columns filtered by province FK
    assertEquals(
      sql.includes(
        "SELECT id, region, province, province_id, created_at, updated_at FROM regions",
      ),
      true,
    );
    assertEquals(sql.includes("regions.province_id IN"), true);
  },
);

Deno.test(
  "build — districts (ADM2) under province (ADM0), 2-level gap, no search, default limit = 10",
  () => {
    const builder = makeBuilder();
    const result = builder.build(AdmLevelCode.DISTRICT, {
      admLevel: AdmLevelCode.PROVINCE,
      id: "prov-1",
    });

    assertEquals(result.dbType, DbType.SQLite);
    assertEquals(result.params, ["prov-1", 10]);

    const sql = normalizeSql(result.sqlTemplate);
    // Outermost SELECT is for districts
    assertEquals(
      sql.includes(
        "SELECT id, district, region, region_id, created_at, updated_at FROM districts",
      ),
      true,
    );
    // districts filtered by region_id IN (regions subquery)
    assertEquals(sql.includes("districts.region_id IN"), true);
    // regions subquery filtered by province_id IN (provinces anchor)
    assertEquals(sql.includes("regions.province_id IN"), true);
    // provinces anchor
    assertEquals(
      sql.includes("SELECT id FROM provinces WHERE provinces.id = ? LIMIT ?"),
      true,
    );
  },
);

Deno.test(
  "build — communes (ADM3) under district (ADM2), direct parent, no search, custom limit",
  () => {
    const builder = makeBuilder();
    const result = builder.build(
      AdmLevelCode.COMMUNE,
      {
        admLevel: AdmLevelCode.DISTRICT,
        id: "dist-1",
      },
      25,
    );

    assertEquals(result.dbType, DbType.SQLite);
    assertEquals(result.params, ["dist-1", 25]);

    const sql = normalizeSql(result.sqlTemplate);
    assertEquals(
      sql.includes(
        "SELECT id, commune, region, district, district_id, created_at, updated_at FROM communes",
      ),
      true,
    );
    assertEquals(sql.includes("communes.district_id IN"), true);
    assertEquals(
      sql.includes("SELECT id FROM districts WHERE districts.id = ? LIMIT ?"),
      true,
    );
  },
);

Deno.test("build — regions (ADM1) under province (ADM0), with search and default limit", () => {
  const builder = makeBuilder();
  const result = builder.build(
    AdmLevelCode.REGION,
    { admLevel: AdmLevelCode.PROVINCE, id: "prov-1" },
    10,
    "Analamanga",
  );

  assertEquals(result.dbType, DbType.SQLite);
  // In SQLite/MySQL, subquery param is first, search param is second
  assertEquals(result.params, ["prov-1", 10, "Analamanga"]);

  const sql = normalizeSql(result.sqlTemplate);
  assertEquals(
    sql.includes("regions.region LIKE ? || '%'"),
    true,
  );
  assertEquals(
    sql.includes("SELECT id FROM provinces WHERE provinces.id = ? LIMIT ?"),
    true,
  );
});

Deno.test(
  "build — fokontanys (ADM4) under commune (ADM3), direct parent, with search, custom limit, and sort = true",
  () => {
    const builder = makeBuilder();
    const result = builder.build(
      AdmLevelCode.FOKONTANY,
      { admLevel: AdmLevelCode.COMMUNE, id: "comm-1" },
      5,
      "Mada",
    );

    assertEquals(result.dbType, DbType.SQLite);
    // commune id first, then limit, then search param
    assertEquals(result.params, ["comm-1", 5, "Mada"]);

    const sql = normalizeSql(result.sqlTemplate);
    assertEquals(sql.includes("fokontanys.fokontany LIKE ? || '%'"), true);
    assertEquals(
      sql.includes("SELECT id FROM communes WHERE communes.id = ? LIMIT ?"),
      true,
    );
    assertEquals(sql.includes("fokontanys.commune_id IN"), true);
    // Verify ascending order by fokontany on the outermost query
    assertEquals(sql.includes("ORDER BY fokontanys.fokontany ASC"), true);
  },
);

Deno.test("build — custom tablesPrefix is applied to table names", () => {
  const builder = makeBuilder(baseConfig({ tablesPrefix: "mada" }));
  const result = builder.build(AdmLevelCode.REGION, {
    admLevel: AdmLevelCode.PROVINCE,
    id: "prov-1",
  });

  const sql = normalizeSql(result.sqlTemplate);
  assertEquals(sql.includes("mada_regions"), true);
  assertEquals(sql.includes("mada_provinces"), true);
});

Deno.test("build — adm_level column included when hasAdmLevel=true", () => {
  const builder = makeBuilder(baseConfig({ hasAdmLevel: true }));
  const result = builder.build(AdmLevelCode.REGION, {
    admLevel: AdmLevelCode.PROVINCE,
    id: "prov-1",
  });

  const sql = normalizeSql(result.sqlTemplate);
  assertEquals(
    sql.includes(
      "SELECT id, region, province, province_id, adm_level, created_at, updated_at FROM regions",
    ),
    true,
  );
});
