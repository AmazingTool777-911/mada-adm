import { AdmLevelCode } from "@scope/consts/models";
import type { DbType } from "@scope/consts/db";
import type { EntityId, Province } from "@scope/types/models";
import type { MadaAdmConfigValues } from "@scope/types/db";
import type { MaybePromise } from "@scope/types/utils";
import type {
  GetProvinceByIdOptions,
  GetProvinceByPointCoordinatesOptions,
  PointCoordinates,
  ProvinceQueries,
} from "@scope/queries/types";
import { AdmTableBaseQueries } from "./adm-table.base.queries.ts";
import {
  GeoJsonFieldNotSupportedError,
} from "../helpers/mada-adm-config-conflict.helper.ts";

export abstract class ProvinceBaseQueries extends AdmTableBaseQueries
  implements ProvinceQueries {
  constructor(
    config: MadaAdmConfigValues,
    dbType: DbType,
  ) {
    super(config, dbType, AdmLevelCode.PROVINCE);
  }

  abstract getAll(): MaybePromise<Province[]>;

  abstract getById(
    id: EntityId,
    options?: GetProvinceByIdOptions,
  ): MaybePromise<Province | null>;

  abstract _getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetProvinceByPointCoordinatesOptions,
  ): MaybePromise<Province | null>;

  getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetProvinceByPointCoordinatesOptions,
  ): MaybePromise<Province | null> {
    if (!this.config.hasGeojson) {
      throw new GeoJsonFieldNotSupportedError();
    }
    return this._getByPointCoordinates(coordinates, options);
  }
}
