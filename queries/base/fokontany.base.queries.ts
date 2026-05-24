import { AdmLevelCode } from "@scope/consts/models";
import type { DbType } from "@scope/consts/db";
import type { Fokontany } from "@scope/types/models";
import type { MadaAdmConfigValues } from "@scope/types/db";
import type { MaybePromise } from "@scope/types/utils";
import type {
  CursorPaginatedResult,
  CursorPaginationParams,
  FokontanyQueries,
  GetManyFokontanysPaginationCursor,
  GetManyFokontanysQueryParams,
} from "@scope/queries/types";
import { AdmTableBaseQueries } from "./adm-table.base.queries.ts";
import type { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";
import {
  ForeignKeysNotRepeatedError,
  ProvinceForeignKeyNotRepeatedError,
} from "../helpers/mada-adm-config-conflict.helper.ts";

export abstract class FokontanyBaseQueries extends AdmTableBaseQueries
  implements FokontanyQueries {
  constructor(
    config: MadaAdmConfigValues,
    dbType: DbType,
  ) {
    super(config, dbType, AdmLevelCode.FOKONTANY);
  }

  abstract get getManyCursorPaginator(): QueryCursorPaginator<
    GetManyFokontanysPaginationCursor,
    Fokontany,
    GetManyFokontanysQueryParams
  >;

  getManyCursorPaginated(
    paginationParams: CursorPaginationParams<GetManyFokontanysPaginationCursor>,
    queryParams: GetManyFokontanysQueryParams,
  ): MaybePromise<
    CursorPaginatedResult<GetManyFokontanysPaginationCursor, Fokontany>
  > {
    if (queryParams?.provinceId && !this.config.isProvinceFkRepeated) {
      throw new ProvinceForeignKeyNotRepeatedError(this.admLevel);
    }
    if (
      (queryParams?.regionId ||
        queryParams?.districtId ||
        queryParams?.communeId) &&
      !this.config.isFkRepeated
    ) {
      throw new ForeignKeysNotRepeatedError(
        this.admLevel,
        queryParams?.regionId
          ? AdmLevelCode.REGION
          : queryParams?.districtId
          ? AdmLevelCode.DISTRICT
          : AdmLevelCode.COMMUNE,
      );
    }
    return this.getManyCursorPaginator.query(paginationParams, queryParams);
  }
}
