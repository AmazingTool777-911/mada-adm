import { AdmLevelCode } from "@scope/consts/models";

export type AdmGeojsonDataSource = {
  url: string;
  isNDJSON: boolean;
};

export const ADM_GEOJSON_DATA_SOURCE_BY_CODE: Map<
  AdmLevelCode,
  AdmGeojsonDataSource
> = new Map<AdmLevelCode, AdmGeojsonDataSource>([
  [
    AdmLevelCode.PROVINCE,
    {
      url:
        "https://github.com/AmazingTool777-911/madagascar-administrative-boundaries/raw/refs/heads/main/data/ndjson/provinces.ndjson",
      isNDJSON: true,
    },
  ],
  [
    AdmLevelCode.REGION,
    {
      url:
        "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/MDG/ADM1/geoBoundaries-MDG-ADM1.geojson",
      isNDJSON: false,
    },
  ],
  [
    AdmLevelCode.DISTRICT,
    {
      url:
        "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/MDG/ADM2/geoBoundaries-MDG-ADM2.geojson",
      isNDJSON: false,
    },
  ],
  [
    AdmLevelCode.COMMUNE,
    {
      url:
        "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/MDG/ADM3/geoBoundaries-MDG-ADM3.geojson",
      isNDJSON: false,
    },
  ],
  [
    AdmLevelCode.FOKONTANY,
    {
      url:
        "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/MDG/ADM4/geoBoundaries-MDG-ADM4.geojson",
      isNDJSON: false,
    },
  ],
]);
