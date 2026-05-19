import type { DbType } from "@scope/consts/db";
import type { EntityId } from "@scope/types/models";
import {
  ADM_LEVEL_CODES_INDEXED,
  ADM_LEVEL_INDEX_BY_CODE,
  type AdmLevelCode,
} from "@scope/consts/models";

export type GetAdmLevelEntitiesSqlQueryBody = {
  dbType: DbType.Postgres | DbType.MySQL | DbType.SQLite;
  sqlTemplate: string;
  params: (string | EntityId | Date | EntityId[])[];
};

export type GetAdmLevelEntitiesMongoQueryBody = {
  dbType: DbType.MongoDB;
  pipeline: Record<string, unknown>[];
};

export type GetAdmLevelEntitiesQueryBody =
  | GetAdmLevelEntitiesSqlQueryBody
  | GetAdmLevelEntitiesMongoQueryBody;

export type GetAdmLevelEntitiesQueryBuilderParams<TQueryBody> = {
  identifiers: {
    type: "id";
    id: EntityId;
  } | {
    type: "parentsForeignKeysQuery";
    query: TQueryBody;
  };
  attributes: "*" | "id";
  search?: string;
  paramsIndexOffset?: number;
  limit?: number;
  sort?: boolean;
};

export interface GetAdmLevelEntitiesQueryBuilder<TQueryBody> {
  build(
    params: GetAdmLevelEntitiesQueryBuilderParams<TQueryBody>,
  ): TQueryBody;
}

export type GetAdmLevelEntitiesOfParentParams = {
  admLevel: AdmLevelCode;
  parent: { admLevel: AdmLevelCode; id: EntityId };
  search?: string;
  limit?: number;
  sort?: boolean;
};

export type GetAdmLevelEntitiesOfParentContext = {
  paramsCount: number;
  depth: number;
};

export abstract class GetAdmLevelEntitiesOfParentQueryBuilder<
  TQueryBody extends GetAdmLevelEntitiesQueryBody,
> {
  readonly #getAdmLevelEntitiesQueryBuilders!: GetAdmLevelEntitiesQueryBuilder<
    TQueryBody
  >[];

  constructor(
    getAdmLevelEntitiesQueryBuilders: Record<
      AdmLevelCode,
      GetAdmLevelEntitiesQueryBuilder<TQueryBody>
    >,
  ) {
    this.#getAdmLevelEntitiesQueryBuilders = ADM_LEVEL_CODES_INDEXED.map((
      admLevel,
    ) => getAdmLevelEntitiesQueryBuilders[admLevel]);
  }

  private _build(
    currentAdmLevel: AdmLevelCode,
    queryParams: GetAdmLevelEntitiesOfParentParams,
    context: GetAdmLevelEntitiesOfParentContext,
  ): TQueryBody {
    const { admLevel, parent, search, limit, sort } = queryParams;

    let attributes!: GetAdmLevelEntitiesQueryBuilderParams<
      unknown
    >["attributes"];
    const isTargetAdmLevel = currentAdmLevel === admLevel;
    const actualSearch = isTargetAdmLevel ? search : undefined;
    const actualSort = isTargetAdmLevel ? sort : undefined;
    if (isTargetAdmLevel) {
      attributes = "*";
    } else {
      attributes = "id";
    }
    const originalParamsCount = context.paramsCount;
    const currentAdmLevelIndex = ADM_LEVEL_INDEX_BY_CODE.get(currentAdmLevel)!;
    const currentAdmLevelQueryBuilder =
      this.#getAdmLevelEntitiesQueryBuilders[currentAdmLevelIndex];
    let currentAdmLevelQueryBody!: TQueryBody;
    if (currentAdmLevel === parent.admLevel) {
      currentAdmLevelQueryBody = currentAdmLevelQueryBuilder.build({
        identifiers: {
          type: "id",
          id: parent.id,
        },
        attributes,
        paramsIndexOffset: originalParamsCount,
        search: actualSearch,
        limit,
        sort: actualSort,
      });
    } else {
      const prevAdmLevel = ADM_LEVEL_CODES_INDEXED[currentAdmLevelIndex - 1];
      if (currentAdmLevel === admLevel && actualSearch) {
        context.paramsCount++;
      }
      const prevAdmLevelQueryBody = this._build(
        prevAdmLevel,
        queryParams,
        { depth: context.depth + 1, paramsCount: context.paramsCount },
      );
      currentAdmLevelQueryBody = currentAdmLevelQueryBuilder.build({
        identifiers: {
          type: "parentsForeignKeysQuery",
          query: prevAdmLevelQueryBody,
        },
        attributes,
        paramsIndexOffset: originalParamsCount,
        search: actualSearch,
        sort: actualSort,
      });
    }

    return currentAdmLevelQueryBody;
  }

  build(
    admLevel: AdmLevelCode,
    parent: GetAdmLevelEntitiesOfParentParams["parent"],
    limit = 10,
    search?: string,
  ): TQueryBody {
    const admLevelIndex = ADM_LEVEL_INDEX_BY_CODE.get(admLevel)!;
    const parentLevelIndex = ADM_LEVEL_INDEX_BY_CODE.get(parent.admLevel)!;
    if (parentLevelIndex >= admLevelIndex) {
      throw new Error("Invalid parent level");
    }

    return this._build(admLevel, {
      admLevel,
      parent,
      search,
      limit,
      sort: true,
    }, {
      paramsCount: 0,
      depth: 0,
    });
  }
}
