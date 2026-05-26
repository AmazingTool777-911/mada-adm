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

export abstract class AdmEntityBaseQueries implements AdmEntityQueries {
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
