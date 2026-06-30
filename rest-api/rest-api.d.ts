import type { GlobalCliConfigResolved } from "@scope/types/cli";
import type { DbConnection } from "@scope/types/db";
import type {
  Commune,
  District,
  Fokontany,
  MadaAdmConfig,
  Province,
  Region,
} from "@scope/types/models";
import type {
  AdmEntityQueries,
  CommuneQueries,
  CursorPaginatedResult,
  DistrictQueries,
  FokontanyQueries,
  GetManyCommunesPaginationCursor,
  GetManyDistrictsPaginationCursor,
  GetManyFokontanysPaginationCursor,
  ProvinceQueries,
  RegionQueries,
} from "@scope/queries/types";
import type { AdmLevelCode } from "@scope/consts/models";
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

export type GetAdmEntitiesInBatchResponseBody = [
  {
    admLevel: { code: AdmLevelCode.PROVINCE; title: string };
    provinces: Province[];
  },
  { admLevel: { code: AdmLevelCode.REGION; title: string }; regions: Region[] },
  {
    admLevel: { code: AdmLevelCode.DISTRICT; title: string };
    paginatedDistricts: CursorPaginatedResult<
      GetManyDistrictsPaginationCursor,
      District
    >;
  },
  {
    admLevel: { code: AdmLevelCode.COMMUNE; title: string };
    paginatedCommunes: CursorPaginatedResult<
      GetManyCommunesPaginationCursor,
      Commune
    >;
  },
  {
    admLevel: { code: AdmLevelCode.FOKONTANY; title: string };
    paginatedFokontanys: CursorPaginatedResult<
      GetManyFokontanysPaginationCursor,
      Fokontany
    >;
  },
];
