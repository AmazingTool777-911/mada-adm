import { AdmLevelCode } from "@scope/consts/models";
import type { DbType } from "@scope/consts/db";
import type { EntityId, Region } from "@scope/types/models";
import type { MadaAdmConfigValues } from "@scope/types/db";
import type { MaybePromise } from "@scope/types/utils";
import type {
  GetRegionByIdOptions,
  GetRegionByPointCoordinatesOptions,
  PointCoordinates,
  RegionQueries,
} from "@scope/queries/types";
import { AdmTableBaseQueries } from "./adm-table.base.queries.ts";
import {
  GeoJsonFieldNotSupportedError,
} from "../helpers/mada-adm-config-conflict.helper.ts";

export abstract class RegionBaseQueries extends AdmTableBaseQueries
  implements RegionQueries {
  constructor(
    config: MadaAdmConfigValues,
    dbType: DbType,
  ) {
    super(config, dbType, AdmLevelCode.REGION);
  }

  abstract getAll(): MaybePromise<Region[]>;

  abstract getById(
    id: EntityId,
    options?: GetRegionByIdOptions,
  ): MaybePromise<Region | null>;

  abstract _getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetRegionByPointCoordinatesOptions,
  ): MaybePromise<Region | null>;

  getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetRegionByPointCoordinatesOptions,
  ): MaybePromise<Region | null> {
    if (!this.config.hasGeojson) {
      throw new GeoJsonFieldNotSupportedError();
    }
    return this._getByPointCoordinates(coordinates, options);
  }
}
