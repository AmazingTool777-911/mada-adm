import type { GlobalCliConfigResolved } from "@scope/types/cli";
import type { DbConnection } from "@scope/types/db";
import type { MadaAdmConfig } from "@scope/types/models";
import type {
  CommuneQueries,
  DistrictQueries,
  FokontanyQueries,
  ProvinceQueries,
  RegionQueries,
} from "@scope/queries/types";

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
  };
};
