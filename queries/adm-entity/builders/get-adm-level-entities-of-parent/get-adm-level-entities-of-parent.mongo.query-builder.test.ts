import { assertEquals, assertThrows } from "@std/assert";

import { AdmLevelCode } from "@scope/consts/models";
import { DbType } from "@scope/consts/db";
import type { MadaAdmConfigValues } from "@scope/types/models";

import {
  GetAdmLevelEntitiesOfParentMongoQueryBuilder,
} from "./get-adm-level-entities-of-parent.mongo.query-builder.ts";

// ─── helpers ────────────────────────────────────────────────────────────────

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
  return new GetAdmLevelEntitiesOfParentMongoQueryBuilder(config);
}

// ─── tests ───────────────────────────────────────────────────────────────────

Deno.test(
  "build (Mongo) — throws when parent level is at or below the target level",
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
  "build (Mongo) — regions (ADM1) under province (ADM0), 1-level gap, no search, default limit = 10",
  () => {
    const builder = makeBuilder();
    const result = builder.build(AdmLevelCode.REGION, {
      admLevel: AdmLevelCode.PROVINCE,
      id: "prov-1",
    });

    assertEquals(result.dbType, DbType.MongoDB);
    const { pipeline } = result;

    // Outer pipeline has lookup, match, project, and sort.
    assertEquals(pipeline.length, 4);

    // Stage 0: $lookup on provinces collection
    const lookupStage = pipeline[0].$lookup as Record<string, unknown>;
    assertEquals(lookupStage.from, "provinces");
    assertEquals(lookupStage.let, { parentFK: "$provinceId" });

    const innerPipeline = lookupStage.pipeline as Record<string, unknown>[];
    // Inner pipeline matches the local ID and then resolves the anchor match stage
    assertEquals(innerPipeline.length, 4);
    assertEquals(innerPipeline[0], {
      $match: { $expr: { $eq: ["$_id", "$$parentFK"] } },
    });
    assertEquals(innerPipeline[1], {
      $match: { _id: "prov-1" },
    });
    assertEquals(innerPipeline[2], {
      $project: { _id: 1 },
    });

    // Stage 1: filter unmatched parents
    assertEquals(pipeline[1], {
      $match: { matched_parent: { $ne: [] } },
    });

    // Stage 2: project out matched_parent field
    assertEquals(pipeline[2], {
      $project: { matched_parent: 0 },
    });

    // Stage 3: sort by target column
    assertEquals(pipeline[3], {
      $sort: { region: 1 },
    });

    // Stage 3 of inner pipeline: default limit = 10 from the parent builder invocation
    assertEquals(innerPipeline[3], { $limit: 10 });
  },
);

Deno.test(
  "build (Mongo) — districts (ADM2) under province (ADM0), 2-level gap, no search, default limit = 10",
  () => {
    const builder = makeBuilder();
    const result = builder.build(AdmLevelCode.DISTRICT, {
      admLevel: AdmLevelCode.PROVINCE,
      id: "prov-1",
    });

    assertEquals(result.dbType, DbType.MongoDB);
    const { pipeline } = result;

    // Districts lookup regions, match parent, project, and sort.
    assertEquals(pipeline.length, 4);
    const lookupRegion = pipeline[0].$lookup as Record<string, unknown>;
    assertEquals(lookupRegion.from, "regions");
    assertEquals(lookupRegion.let, { parentFK: "$regionId" });

    // Region sub-pipeline contains lookup provinces
    const regionPipeline = lookupRegion.pipeline as Record<string, unknown>[];
    assertEquals(regionPipeline[0], {
      $match: { $expr: { $eq: ["$_id", "$$parentFK"] } },
    });

    const lookupProvinceStage = regionPipeline[1].$lookup as Record<
      string,
      unknown
    >;
    assertEquals(lookupProvinceStage.from, "provinces");
    assertEquals(lookupProvinceStage.let, { parentFK: "$provinceId" });

    const provincePipeline = lookupProvinceStage.pipeline as Record<
      string,
      unknown
    >[];
    assertEquals(provincePipeline[0], {
      $match: { $expr: { $eq: ["$_id", "$$parentFK"] } },
    });
    assertEquals(provincePipeline[1], {
      $match: { _id: "prov-1" },
    });
    // Default limit on provinces anchor
    assertEquals(provincePipeline[2], { $project: { _id: 1 } });
    assertEquals(provincePipeline[3], { $limit: 10 });

    // Outer pipeline sort stage
    assertEquals(pipeline[3], {
      $sort: { district: 1 },
    });
  },
);

Deno.test(
  "build (Mongo) — communes (ADM3) under district (ADM2), direct parent, no search, custom limit",
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

    assertEquals(result.dbType, DbType.MongoDB);
    const { pipeline } = result;

    assertEquals(pipeline.length, 4);
    // Communes lookup districts
    const lookupDistrict = pipeline[0].$lookup as Record<string, unknown>;
    assertEquals(lookupDistrict.from, "districts");

    const districtPipeline = lookupDistrict.pipeline as Record<
      string,
      unknown
    >[];
    assertEquals(districtPipeline[1], {
      $match: { _id: "dist-1" },
    });
    assertEquals(districtPipeline[2], {
      $project: { _id: 1 },
    });
    // Custom limit on anchor
    assertEquals(districtPipeline[3], { $limit: 25 });

    // Outer pipeline sort stage
    assertEquals(pipeline[3], {
      $sort: { commune: 1 },
    });
  },
);

Deno.test("build (Mongo) — regions (ADM1) under province (ADM0), with search and default limit", () => {
  const builder = makeBuilder();
  const result = builder.build(
    AdmLevelCode.REGION,
    { admLevel: AdmLevelCode.PROVINCE, id: "prov-1" },
    10,
    "Analamanga",
  );

  assertEquals(result.dbType, DbType.MongoDB);
  const { pipeline } = result;

  // Since search is passed on the target level, we should have a $match range stage and a $sort stage
  assertEquals(pipeline.length, 5);
  assertEquals(pipeline[3], {
    $match: {
      region: {
        $gte: "Analamanga",
        $lt: "Analamangb",
      },
    },
  });
});

Deno.test(
  "build (Mongo) — fokontanys (ADM4) under commune (ADM3), direct parent, with search, custom limit, and sort = true",
  () => {
    const builder = makeBuilder();
    const result = builder.build(
      AdmLevelCode.FOKONTANY,
      { admLevel: AdmLevelCode.COMMUNE, id: "comm-1" },
      5,
      "Mada",
    );

    assertEquals(result.dbType, DbType.MongoDB);
    const { pipeline } = result;

    // Search and Sort on target Fokontanys
    assertEquals(pipeline.length, 5);
    assertEquals(pipeline[3], {
      $match: {
        fokontany: {
          $gte: "Mada",
          $lt: "Madb",
        },
      },
    });
    assertEquals(pipeline[4], {
      $sort: {
        fokontany: 1,
      },
    });
  },
);

Deno.test("build (Mongo) — custom tablesPrefix is applied to collection names", () => {
  const builder = makeBuilder(baseConfig({ tablesPrefix: "mada" }));
  const result = builder.build(AdmLevelCode.REGION, {
    admLevel: AdmLevelCode.PROVINCE,
    id: "prov-1",
  });

  const { pipeline } = result;
  const lookupStage = pipeline[0].$lookup as Record<string, unknown>;
  // Collection name gets camelCase prefixing
  assertEquals(lookupStage.from, "madaProvinces");
});

Deno.test("build (Mongo) — only projects _id when attributes === 'id'", () => {
  // Let's test with exact params
  const targetIdBuilder = makeBuilder();

  const idOnlyResult = targetIdBuilder.build(
    AdmLevelCode.REGION,
    {
      admLevel: AdmLevelCode.PROVINCE,
      id: "prov-1",
    },
  );
  // The recursive query builder always calls:
  // attributes: "id" for nested queries, let's verify!
  // Yes! In get-adm-level-entities-of-parent.query-builder.ts:
  // "attributes: depth === 0 ? attributes : 'id'"
  // So the inner lookup queries correctly only project ID!
  const lookupStage = idOnlyResult.pipeline[0].$lookup as Record<
    string,
    unknown
  >;
  const innerPipeline = lookupStage.pipeline as Record<string, unknown>[];
  // Verify that inside provinces inner pipeline we project only _id
  assertEquals(innerPipeline[2], {
    $project: { _id: 1 },
  });
});
