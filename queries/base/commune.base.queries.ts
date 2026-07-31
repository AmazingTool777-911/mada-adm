import { AdmLevelCode } from "@scope/consts/models";
import type { DbType } from "@scope/consts/db";
import type { Commune, EntityId } from "@scope/types/models";
import type { MadaAdmConfigValues } from "@scope/types/db";
import type { MaybePromise } from "@scope/types/utils";
import type {
  CommuneQueries,
  CursorPaginatedResult,
  CursorPaginationParams,
  GetCommuneByIdOptions,
  GetCommuneByPointCoordinatesOptions,
  GetManyCommunesPaginationCursor,
  GetManyCommunesQueryParams,
  PointCoordinates,
} from "@scope/queries/types";
import { AdmTableBaseQueries } from "./adm-table.base.queries.ts";
import type { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";
import {
  ForeignKeysNotRepeatedError,
  GeoJsonFieldNotSupportedError,
  ProvinceForeignKeyNotRepeatedError,
} from "../helpers/mada-adm-config-conflict.helper.ts";

export abstract class CommuneBaseQueries extends AdmTableBaseQueries
  implements CommuneQueries {
  constructor(
    config: MadaAdmConfigValues,
    dbType: DbType,
  ) {
    super(config, dbType, AdmLevelCode.COMMUNE);
  }

  abstract get getManyCursorPaginator(): QueryCursorPaginator<
    GetManyCommunesPaginationCursor,
    Commune,
    GetManyCommunesQueryParams
  >;

  abstract getById(
    id: EntityId,
    options?: GetCommuneByIdOptions,
  ): MaybePromise<Commune | null>;

  abstract _getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetCommuneByPointCoordinatesOptions,
  ): MaybePromise<Commune | null>;

  getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetCommuneByPointCoordinatesOptions,
  ): MaybePromise<Commune | null> {
    if (!this.config.hasGeojson) {
      throw new GeoJsonFieldNotSupportedError();
    }
    return this._getByPointCoordinates(coordinates, options);
  }

  getManyCursorPaginated(
    paginationParams: CursorPaginationParams<GetManyCommunesPaginationCursor>,
    queryParams?: GetManyCommunesQueryParams,
  ): MaybePromise<
    CursorPaginatedResult<GetManyCommunesPaginationCursor, Commune>
  > {
    if (queryParams?.provinceId && !this.config.isProvinceFkRepeated) {
      throw new ProvinceForeignKeyNotRepeatedError(this.admLevel);
    }
    if (queryParams?.regionId && !this.config.isFkRepeated) {
      throw new ForeignKeysNotRepeatedError(
        this.admLevel,
        AdmLevelCode.REGION,
      );
    }
    return this.getManyCursorPaginator.query(paginationParams, queryParams);
  }
}
