import { AdmLevelCode } from "@scope/consts/models";
import type { DbType } from "@scope/consts/db";
import type { District, EntityId } from "@scope/types/models";
import type { MadaAdmConfigValues } from "@scope/types/db";
import type { MaybePromise } from "@scope/types/utils";
import type {
  CursorPaginatedResult,
  CursorPaginationParams,
  DistrictQueries,
  GetDistrictByIdOptions,
  GetManyDistrictsPaginationCursor,
  GetManyDistrictsQueryParams,
} from "@scope/queries/types";
import { AdmTableBaseQueries } from "./adm-table.base.queries.ts";
import type { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";
import { ProvinceForeignKeyNotRepeatedError } from "../helpers/mada-adm-config-conflict.helper.ts";

export abstract class DistrictBaseQueries extends AdmTableBaseQueries
  implements DistrictQueries {
  constructor(
    config: MadaAdmConfigValues,
    dbType: DbType,
  ) {
    super(config, dbType, AdmLevelCode.DISTRICT);
  }

  abstract get getManyCursorPaginator(): QueryCursorPaginator<
    GetManyDistrictsPaginationCursor,
    District,
    GetManyDistrictsQueryParams
  >;

  abstract getById(
    id: EntityId,
    options?: GetDistrictByIdOptions,
  ): MaybePromise<District | null>;

  getManyCursorPaginated(
    paginationParams: CursorPaginationParams<GetManyDistrictsPaginationCursor>,
    queryParams?: GetManyDistrictsQueryParams,
  ): MaybePromise<
    CursorPaginatedResult<GetManyDistrictsPaginationCursor, District>
  > {
    if (queryParams?.provinceId && !this.config.isProvinceFkRepeated) {
      throw new ProvinceForeignKeyNotRepeatedError(this.admLevel);
    }
    return this.getManyCursorPaginator.query(paginationParams, queryParams);
  }
}
