import { AdmLevelCode } from "@scope/consts/models";
import type { DbType } from "@scope/consts/db";
import type { District } from "@scope/types/models";
import type { MadaAdmConfigValues } from "@scope/types/db";
import type { MaybePromise } from "@scope/types/utils";
import type {
  CursorPaginatedResult,
  CursorPaginationParams,
  DistrictQueries,
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

  getManyCursorPaginated(
    paginationParams: CursorPaginationParams<GetManyDistrictsPaginationCursor>,
    queryParams: GetManyDistrictsQueryParams,
  ): MaybePromise<
    CursorPaginatedResult<GetManyDistrictsPaginationCursor, District>
  > {
    if (queryParams?.provinceId && !this.config.isProvinceFkRepeated) {
      throw new ProvinceForeignKeyNotRepeatedError(this.admLevel, this.config);
    }
    return this.getManyCursorPaginator.query(paginationParams, queryParams);
  }
}
