import type { MaybePromise } from "@scope/types/utils";
import type {
  AdmEntityQueries,
  CursorPaginatedResult,
  CursorPaginationParams,
  GetAdmEntitiesUnionPaginationCursor,
  GetAdmEntitiesUnionQueryParams,
} from "@scope/queries/types";
import type { QueryCursorPaginator } from "@scope/queries/helpers";
import type { AdmEntity } from "@scope/types/models";
import { AdmLevelCode } from "@scope/consts/models";
import {
  isCommuneValues,
  isDistrictValues,
  isFokontanyValues,
  isRegionValues,
} from "@scope/helpers/models";

export abstract class AdmEntityBaseQueries implements AdmEntityQueries {
  protected getGetAdmEntitiesUnionRecordToCursor(
    record: AdmEntity,
  ): GetAdmEntitiesUnionPaginationCursor {
    if (isFokontanyValues(record)) {
      return {
        admLevel: AdmLevelCode.FOKONTANY,
        value: record.fokontany,
        id: record.id,
      };
    } else if (isCommuneValues(record)) {
      return {
        admLevel: AdmLevelCode.COMMUNE,
        value: record.commune,
        id: record.id,
      };
    } else if (isDistrictValues(record)) {
      return { admLevel: AdmLevelCode.DISTRICT, value: record.district };
    } else if (isRegionValues(record)) {
      return { admLevel: AdmLevelCode.REGION, value: record.region };
    } else {
      return { admLevel: AdmLevelCode.PROVINCE, value: record.province };
    }
  }

  protected abstract get getUnionCursorPaginator(): QueryCursorPaginator<
    GetAdmEntitiesUnionPaginationCursor,
    AdmEntity,
    GetAdmEntitiesUnionQueryParams
  >;

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
  > {
    return this.getUnionCursorPaginator.query(paginationParams, queryParams);
  }
}
