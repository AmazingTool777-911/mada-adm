import type { MaybePromise } from "@scope/types/utils";
import type {
  AdmEntity,
  Commune,
  District,
  EntityId,
  Fokontany,
  Province,
  Region,
} from "@scope/types/models";
import type { AdmLevelCode } from "@scope/consts/models";

export type QueriesExtraOptions = {
  pgSchema?: string;
};

export type CursorPaginationParams<TCursor> = {
  limit: number;
  cursor?: TCursor | null;
  cursorEncoded?: string | null;
  encodeCursor?: boolean;
};

export type CursorPaginatedResult<TCursor, TRecord> = {
  records: TRecord[];
  next: TCursor | null;
  nextEncoded?: string;
  current: TCursor | null;
  currentEncoded?: string;
  limit: number;
};

export type GetProvinceByIdOptions = {
  excludeGeoJSON?: boolean;
};

export interface ProvinceQueries {
  getAll(): MaybePromise<Province[]>;

  getById(
    id: EntityId,
    options?: GetProvinceByIdOptions,
  ): MaybePromise<Province | null>;
}

export type GetRegionByIdOptions = {
  excludeGeoJSON?: boolean;
};

export interface RegionQueries {
  getAll(): MaybePromise<Region[]>;

  getById(
    id: EntityId,
    options?: GetRegionByIdOptions,
  ): MaybePromise<Region | null>;
}

export type GetManyDistrictsPaginationCursor = {
  district: string;
  id: EntityId;
};

export type GetManyDistrictsQueryParams = {
  regionId?: EntityId;
  provinceId?: EntityId;
  search?: string;
};

export type GetDistrictByIdOptions = {
  excludeGeoJSON?: boolean;
};

export interface DistrictQueries {
  getManyCursorPaginated(
    paginationParams: CursorPaginationParams<GetManyDistrictsPaginationCursor>,
    queryParams?: GetManyDistrictsQueryParams,
  ): MaybePromise<
    CursorPaginatedResult<GetManyDistrictsPaginationCursor, District>
  >;

  getById(
    id: EntityId,
    options?: GetDistrictByIdOptions,
  ): MaybePromise<District | null>;
}

export type GetManyCommunesPaginationCursor = {
  commune: string;
  id: EntityId;
};

export type GetManyCommunesQueryParams = {
  districtId?: EntityId;
  regionId?: EntityId;
  provinceId?: EntityId;
  search?: string;
};

export type GetCommuneByIdOptions = {
  excludeGeoJSON?: boolean;
};

export interface CommuneQueries {
  getManyCursorPaginated(
    paginationParams: CursorPaginationParams<GetManyCommunesPaginationCursor>,
    queryParams?: GetManyCommunesQueryParams,
  ): MaybePromise<
    CursorPaginatedResult<GetManyCommunesPaginationCursor, Commune>
  >;

  getById(
    id: EntityId,
    options?: GetCommuneByIdOptions,
  ): MaybePromise<Commune | null>;
}

export type GetManyFokontanysPaginationCursor = {
  fokontany: string;
  id: EntityId;
};

export type GetManyFokontanysQueryParams = {
  communeId?: EntityId;
  districtId?: EntityId;
  regionId?: EntityId;
  provinceId?: EntityId;
  search?: string;
};

export type GetFokontanyByIdOptions = {
  excludeGeoJSON?: boolean;
};

export interface FokontanyQueries {
  getManyCursorPaginated(
    paginationParams: CursorPaginationParams<GetManyFokontanysPaginationCursor>,
    queryParams?: GetManyFokontanysQueryParams,
  ): MaybePromise<
    CursorPaginatedResult<GetManyFokontanysPaginationCursor, Fokontany>
  >;

  getById(
    id: EntityId,
    options?: GetFokontanyByIdOptions,
  ): MaybePromise<Fokontany | null>;
}

export type GetAdmEntitiesUnionPaginationCursor =
  & {
    value: string;
  }
  & ({
    admLevel:
      | AdmLevelCode.PROVINCE
      | AdmLevelCode.REGION
      | AdmLevelCode.DISTRICT;
  } | {
    admLevel: AdmLevelCode.COMMUNE | AdmLevelCode.FOKONTANY;
    id: EntityId;
  });

export type GetAdmEntitiesUnionQueryParams = {
  from?: AdmLevelCode;
  search?: string;
};

export interface AdmEntityQueries {
  getUnionCursorPaginated(
    paginationParams: CursorPaginationParams<
      GetAdmEntitiesUnionPaginationCursor
    >,
    queryParams?: GetAdmEntitiesUnionQueryParams,
  ): MaybePromise<
    CursorPaginatedResult<
      GetAdmEntitiesUnionPaginationCursor,
      AdmEntity
    >
  >;
}
