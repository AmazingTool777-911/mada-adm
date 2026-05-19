import { ObjectId } from "mongodb";
import { DbType } from "@scope/consts/db";
import {
  ADM_LEVEL_CODES_INDEXED,
  ADM_LEVEL_INDEX_BY_CODE,
  ADM_LEVEL_TITLE_BY_CODE,
  AdmLevelCode,
} from "@scope/consts/models";
import type { MadaAdmConfigValues } from "@scope/types/models";
import { prefixWithCamelCase } from "@scope/utils/string";

import {
  type GetAdmLevelEntitiesMongoQueryBody,
  GetAdmLevelEntitiesOfParentQueryBuilder,
  type GetAdmLevelEntitiesQueryBuilder,
  type GetAdmLevelEntitiesQueryBuilderParams,
} from "./get-adm-level-entities-of-parent.query-builder.ts";

/**
 * Builds an index-friendly prefix range query for MongoDB.
 *
 * @param field - The field to search.
 * @param prefix - The prefix search term.
 * @returns The MongoDB range filter query.
 */
function buildPrefixQuery(
  field: string,
  prefix: string,
): Record<string, unknown> {
  // Increment the last character to create the upper bound
  const upperBound = prefix.slice(0, -1) +
    String.fromCharCode(prefix.charCodeAt(prefix.length - 1) + 1);

  return {
    [field]: {
      $gte: prefix,
      $lt: upperBound,
    },
  };
}

/**
 * Base abstract class for building MongoDB queries for a specific ADM level.
 */
abstract class GetAdmLevelMongoQueryBuilder
  implements
    GetAdmLevelEntitiesQueryBuilder<GetAdmLevelEntitiesMongoQueryBody> {
  protected admLevel!: AdmLevelCode;

  #config!: MadaAdmConfigValues;

  /**
   * Gets the target column (field) name for this ADM level.
   */
  protected get targetColumn(): string {
    return ADM_LEVEL_TITLE_BY_CODE.get(this.admLevel)!;
  }

  /**
   * Constructs an instance of {@link GetAdmLevelMongoQueryBuilder}.
   *
   * @param config - The administrative boundaries configuration values.
   * @param admLevel - The ADM level of the query builder.
   */
  constructor(
    config: MadaAdmConfigValues,
    admLevel: AdmLevelCode,
  ) {
    this.admLevel = admLevel;
    this.#config = config;
  }

  /**
   * Resolves the collection name for a given ADM level with camelCase prefixing.
   *
   * @param level - The ADM level.
   * @returns The resolved collection name.
   */
  protected getCollectionName(level: AdmLevelCode): string {
    const title = ADM_LEVEL_TITLE_BY_CODE.get(level)!;
    return prefixWithCamelCase(this.#config.tablesPrefix, `${title}s`);
  }

  /**
   * Builds the MongoDB aggregation pipeline for this ADM level.
   *
   * @param params - The parameters for building the query.
   * @returns The resolved MongoDB query body.
   */
  public build(
    { identifiers, attributes, search, limit, sort }:
      GetAdmLevelEntitiesQueryBuilderParams<
        GetAdmLevelEntitiesMongoQueryBody
      >,
  ): GetAdmLevelEntitiesMongoQueryBody {
    const pipeline: Record<string, unknown>[] = [];

    if (identifiers.type === "id") {
      pipeline.push({
        $match: {
          _id: ObjectId.isValid(identifiers.id)
            ? new ObjectId(identifiers.id)
            : identifiers.id,
        },
      });

      if (attributes === "id") {
        pipeline.push({
          $project: {
            _id: 1,
          },
        });
      }

      if (search) {
        pipeline.push({
          $match: buildPrefixQuery(this.targetColumn, search),
        });
      }

      if (sort) {
        pipeline.push({
          $sort: {
            [this.targetColumn]: 1,
          },
        });
      }

      if (limit !== undefined) {
        pipeline.push({
          $limit: limit,
        });
      }
    } else {
      const prevAdmLevel = ADM_LEVEL_CODES_INDEXED[
        ADM_LEVEL_INDEX_BY_CODE.get(this.admLevel)! - 1
      ];
      const prevAdmLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(prevAdmLevel)!;
      const prevAdmLevelFK = `${prevAdmLevelTitle}Id`;
      const prevCollectionName = this.getCollectionName(prevAdmLevel);

      pipeline.push({
        $lookup: {
          from: prevCollectionName,
          let: { parentFK: `$${prevAdmLevelFK}` },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$parentFK"],
                },
              },
            },
            ...identifiers.query.pipeline,
          ],
          as: "matched_parent",
        },
      });

      pipeline.push({
        $match: {
          matched_parent: {
            $ne: [],
          },
        },
      });

      if (attributes === "id") {
        pipeline.push({
          $project: {
            _id: 1,
          },
        });
      } else {
        pipeline.push({
          $project: {
            matched_parent: 0,
          },
        });
      }

      if (search) {
        pipeline.push({
          $match: buildPrefixQuery(this.targetColumn, search),
        });
      }

      if (sort) {
        pipeline.push({
          $sort: {
            [this.targetColumn]: 1,
          },
        });
      }

      if (limit !== undefined) {
        pipeline.push({
          $limit: limit,
        });
      }
    }

    return { pipeline, dbType: DbType.MongoDB };
  }
}

/**
 * MongoDB query builder for provinces.
 */
class GetProvincesMongoQueryBuilder extends GetAdmLevelMongoQueryBuilder {
  /**
   * Constructs an instance of {@link GetProvincesMongoQueryBuilder}.
   *
   * @param config - The administrative boundaries configuration values.
   */
  constructor(config: MadaAdmConfigValues) {
    super(config, AdmLevelCode.PROVINCE);
  }
}

/**
 * MongoDB query builder for regions.
 */
class GetRegionsMongoQueryBuilder extends GetAdmLevelMongoQueryBuilder {
  /**
   * Constructs an instance of {@link GetRegionsMongoQueryBuilder}.
   *
   * @param config - The administrative boundaries configuration values.
   */
  constructor(config: MadaAdmConfigValues) {
    super(config, AdmLevelCode.REGION);
  }
}

/**
 * MongoDB query builder for districts.
 */
class GetDistrictsMongoQueryBuilder extends GetAdmLevelMongoQueryBuilder {
  /**
   * Constructs an instance of {@link GetDistrictsMongoQueryBuilder}.
   *
   * @param config - The administrative boundaries configuration values.
   */
  constructor(config: MadaAdmConfigValues) {
    super(config, AdmLevelCode.DISTRICT);
  }
}

/**
 * MongoDB query builder for communes.
 */
class GetCommunesMongoQueryBuilder extends GetAdmLevelMongoQueryBuilder {
  /**
   * Constructs an instance of {@link GetCommunesMongoQueryBuilder}.
   *
   * @param config - The administrative boundaries configuration values.
   */
  constructor(config: MadaAdmConfigValues) {
    super(config, AdmLevelCode.COMMUNE);
  }
}

/**
 * MongoDB query builder for fokontanys.
 */
class GetFokontanyMongoQueryBuilder extends GetAdmLevelMongoQueryBuilder {
  /**
   * Constructs an instance of {@link GetFokontanyMongoQueryBuilder}.
   *
   * @param config - The administrative boundaries configuration values.
   */
  constructor(config: MadaAdmConfigValues) {
    super(config, AdmLevelCode.FOKONTANY);
  }
}

/**
 * Query builder for retrieving administrative entities under a parent level in MongoDB.
 */
export class GetAdmLevelEntitiesOfParentMongoQueryBuilder
  extends GetAdmLevelEntitiesOfParentQueryBuilder<
    GetAdmLevelEntitiesMongoQueryBody
  > {
  /**
   * Constructs an instance of {@link GetAdmLevelEntitiesOfParentMongoQueryBuilder}.
   *
   * @param config - The administrative boundaries configuration values.
   */
  constructor(config: MadaAdmConfigValues) {
    super({
      [AdmLevelCode.PROVINCE]: new GetProvincesMongoQueryBuilder(config),
      [AdmLevelCode.REGION]: new GetRegionsMongoQueryBuilder(config),
      [AdmLevelCode.DISTRICT]: new GetDistrictsMongoQueryBuilder(config),
      [AdmLevelCode.COMMUNE]: new GetCommunesMongoQueryBuilder(config),
      [AdmLevelCode.FOKONTANY]: new GetFokontanyMongoQueryBuilder(config),
    });
  }
}

let _instance: GetAdmLevelEntitiesOfParentMongoQueryBuilder | null = null;

/**
 * Injects (or creates) a singleton instance of {@link GetAdmLevelEntitiesOfParentMongoQueryBuilder}.
 *
 * @param config - The administrative boundaries configuration values.
 * @returns The singleton query builder instance.
 */
export function injectGetAdmLevelEntitiesOfParentMongoQueryBuilder(
  config: MadaAdmConfigValues,
): GetAdmLevelEntitiesOfParentMongoQueryBuilder {
  return _instance ??
    (_instance = new GetAdmLevelEntitiesOfParentMongoQueryBuilder(config));
}
