import type { GlobalCliConfigResolved } from "@scope/types/cli";
import type { DbConnection } from "@scope/types/db";
import type { MadaAdmConfig } from "@scope/types/models";
import type {
  AdmEntityQueries,
  CommuneQueries,
  DistrictQueries,
  FokontanyQueries,
  ProvinceQueries,
  RegionQueries,
} from "@scope/queries/types";
import type { ResponseErrorCode } from "./consts/response-error-code.const.ts";

export type ApiErrorResponse = {
  error: string;
  code: ResponseErrorCode;
  [key: string]: unknown;
};

export type RestApiEnv = {
  Variables: {
    db: DbConnection;
    config: GlobalCliConfigResolved;
    madaAdmConfig: MadaAdmConfig;
    provinceQueries: ProvinceQueries;
    regionQueries: RegionQueries;
    districtQueries: DistrictQueries;
    communeQueries: CommuneQueries;
    fokontanyQueries: FokontanyQueries;
    admEntityQueries: AdmEntityQueries;
  };
};
