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
  GetDistrictByPointCoodrdinatesOptions,
  GetManyDistrictsPaginationCursor,
  GetManyDistrictsQueryParams,
  PointCoordinates,
} from "@scope/queries/types";
import { AdmTableBaseQueries } from "./adm-table.base.queries.ts";
import type { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";
import {
  GeoJsonFieldNotSupportedError,
  ProvinceForeignKeyNotRepeatedError,
} from "../helpers/mada-adm-config-conflict.helper.ts";

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

  abstract _getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetDistrictByPointCoodrdinatesOptions,
  ): MaybePromise<District | null>;

  getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetDistrictByPointCoodrdinatesOptions,
  ): MaybePromise<District | null> {
    if (!this.config.hasGeojson) {
      throw new GeoJsonFieldNotSupportedError();
    }
    return this._getByPointCoordinates(coordinates, options);
  }

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
