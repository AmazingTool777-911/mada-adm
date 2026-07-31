import { ObjectId } from "mongodb";
import type z from "@zod/zod";

import {
  ADM_LEVEL_CODES_INDEXED,
  ADM_LEVEL_INDEX_BY_CODE,
  ADM_LEVEL_TITLE_BY_CODE,
  AdmLevelCode,
} from "@scope/consts/models";
import { AdmEntityBaseQueries } from "../base/adm-entity.base.queries.ts";
import { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";
import type {
  CursorPaginationParams,
  GetAdmEntitiesUnionPaginationCursor,
  GetAdmEntitiesUnionQueryParams,
} from "@scope/queries/types";
import type {
  AdmEntity,
  AdmEntityBSONUnionRecord,
  MadaAdmConfigValues,
} from "@scope/types/models";
import { mapAdmEntityUnionBSONRecordToEntity } from "@scope/helpers/models";
import { getAdmEntitiesUnionPaginationCursorSchema } from "../schemas/adm-entity.schemas.ts";
import type { MongoDbConnection } from "@scope/adapters/mongo/db";
import { getAdmTableName } from "@scope/helpers/db";
import {
  ADM_ENTITIES_UNION_TARGET_COLUMN_NAME,
  DbType,
} from "@scope/consts/db";
import { incrementLastCharacterCodePoint } from "@scope/utils/string";

export type MongoProjectionStageAttributes = Record<
  string,
  number | Record<string, unknown>
>;

export type GetSelectAdmEntitiesSetQueryTemplateParam = string | number;

export type GetSelectAdmEntitiesSetQueryTemplateResult = {
  sql: string;
  params: GetSelectAdmEntitiesSetQueryTemplateParam[];
};

export class AdmEntityMongoDbQueries extends AdmEntityBaseQueries {
  #getUnionCursorPaginator!: QueryCursorPaginator<
    GetAdmEntitiesUnionPaginationCursor,
    AdmEntity,
    GetAdmEntitiesUnionQueryParams
  >;

  override get getUnionCursorPaginator(): QueryCursorPaginator<
    GetAdmEntitiesUnionPaginationCursor,
    AdmEntity,
    GetAdmEntitiesUnionQueryParams
  > {
    if (this.#getUnionCursorPaginator) return this.#getUnionCursorPaginator;
    return new QueryCursorPaginator<
      GetAdmEntitiesUnionPaginationCursor,
      AdmEntity,
      GetAdmEntitiesUnionQueryParams
    >({
      toCursor: (record) => {
        return this.getGetAdmEntitiesUnionRecordToCursor(record);
      },
      cursorEncodedSchema:
        getAdmEntitiesUnionPaginationCursorSchema as z.Schema<
          GetAdmEntitiesUnionPaginationCursor
        >,
      queryFn: async (
        paginationParams,
        queryParams,
      ): Promise<AdmEntity[]> => {
        const { limit, cursor } = paginationParams;

        const queryParamsAdmLevelIndexFrom = ADM_LEVEL_INDEX_BY_CODE.get(
          queryParams?.from ?? AdmLevelCode.PROVINCE,
        )!;
        const cursorAdmLevelIndex = cursor?.admLevel
          ? ADM_LEVEL_INDEX_BY_CODE.get(cursor.admLevel)!
          : null;
        const startingAdmLevelIndex = cursorAdmLevelIndex
          ? Math.max(queryParamsAdmLevelIndexFrom, cursorAdmLevelIndex)
          : queryParamsAdmLevelIndexFrom;

        const unionPipelineStages: Record<string, unknown>[] = [];

        for (
          let i = startingAdmLevelIndex;
          i < ADM_LEVEL_CODES_INDEXED.length;
          i++
        ) {
          const admLevel = ADM_LEVEL_CODES_INDEXED[i];
          const admLevelPipelineStages = this
            .getFindAdmEntitiesUnionSetPipeline(
              admLevel,
              paginationParams,
              queryParams,
            );
          if (i === startingAdmLevelIndex) {
            unionPipelineStages.push(...admLevelPipelineStages);
          } else {
            const collectionName = getAdmTableName(
              admLevel,
              this.config,
              DbType.MongoDB,
            );
            unionPipelineStages.push({
              $unionWith: {
                coll: collectionName,
                pipeline: admLevelPipelineStages,
              },
            });
          }
        }

        if (startingAdmLevelIndex < (ADM_LEVEL_CODES_INDEXED.length - 1)) {
          unionPipelineStages.push(
            {
              $sort: {
                admLevel: 1,
                [ADM_ENTITIES_UNION_TARGET_COLUMN_NAME]: 1,
                _id: 1,
              },
            },
            { $limit: limit },
          );
        }

        const startingAdmLevel = ADM_LEVEL_CODES_INDEXED[startingAdmLevelIndex];
        const startingAdmLevelCollectionName = getAdmTableName(
          startingAdmLevel,
          this.config,
          DbType.MongoDB,
        );

        const rows = await this.dbConnection.db
          .collection(startingAdmLevelCollectionName)
          .aggregate<AdmEntityBSONUnionRecord>(unionPipelineStages)
          .toArray();

        return rows.map<AdmEntity>((row) =>
          mapAdmEntityUnionBSONRecordToEntity(row)
        );
      },
    });
  }

  constructor(
    private config: MadaAdmConfigValues,
    private dbConnection: MongoDbConnection,
  ) {
    super();
  }

  private getFindAdmEntitiesUnionSetPipeline(
    admLevel: AdmLevelCode,
    paginationParams: CursorPaginationParams<
      GetAdmEntitiesUnionPaginationCursor
    >,
    queryParams: GetAdmEntitiesUnionQueryParams = {},
  ): Record<string, unknown>[] {
    const admLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(admLevel)!;
    const admLevelIndex = ADM_LEVEL_INDEX_BY_CODE.get(admLevel)!;

    const pipeline: Record<string, unknown>[] = [];

    let matchStage: Record<"$match", Record<string, unknown>> | null = null;
    const { cursor, limit } = paginationParams;
    if (cursor) {
      matchStage = {
        $match: {
          $or: (cursor.admLevel === AdmLevelCode.COMMUNE ||
              cursor.admLevel === AdmLevelCode.FOKONTANY)
            ? [
              { [admLevelTitle]: { $gt: cursor.value } },
              {
                [admLevelTitle]: cursor.value,
                _id: { $gte: new ObjectId(cursor.id) },
              },
            ]
            : [
              { [admLevelTitle]: { $gte: cursor.value } },
            ],
        },
      };
    }
    if (queryParams.search) {
      if (!matchStage) {
        matchStage = {
          $match: {},
        };
      }
      matchStage.$match[admLevelTitle] = {
        $gte: queryParams.search,
        $lt: incrementLastCharacterCodePoint(queryParams.search),
      };
    }
    if (matchStage) {
      pipeline.push(matchStage);
    }

    const sortFields: Record<string, number> = {
      [admLevelTitle]: 1,
    };
    if (
      admLevel === AdmLevelCode.COMMUNE || admLevel === AdmLevelCode.FOKONTANY
    ) {
      sortFields._id = 1;
    }
    pipeline.push({ $sort: sortFields }, { $limit: limit });

    const addFieldsStage: Record<"$addFields", Record<string, unknown>> = {
      "$addFields": {
        [ADM_ENTITIES_UNION_TARGET_COLUMN_NAME]: `$${admLevelTitle}`,
        geojson: "$$REMOVE",
      },
    };
    if (!this.config.hasAdmLevel) {
      addFieldsStage["$addFields"]["admLevel"] = admLevelIndex;
    }
    pipeline.push(addFieldsStage);

    return pipeline;
  }
}

let _instance: AdmEntityMongoDbQueries | null = null;

export function injectAdmEntityMongoQueries(
  config: MadaAdmConfigValues,
  dbConnection: MongoDbConnection,
): AdmEntityMongoDbQueries {
  if (_instance) {
    return _instance;
  }
  _instance = new AdmEntityMongoDbQueries(config, dbConnection);
  return _instance;
}
