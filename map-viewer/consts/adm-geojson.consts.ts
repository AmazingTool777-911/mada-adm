import { AdmLevelCode } from "@scope/consts/models";

export type AdmGeojsonDataSource = {
  rawURL: string;
  previewURL: string;
  isNDJSON: boolean;
};

export const ADM_GEOJSON_DATA_SOURCE_BY_CODE: Map<
  AdmLevelCode,
  AdmGeojsonDataSource
> = new Map<AdmLevelCode, AdmGeojsonDataSource>([
  [
    AdmLevelCode.PROVINCE,
    {
      rawURL:
        "https://github.com/AmazingTool777-911/madagascar-administrative-boundaries/raw/refs/heads/main/data/ndjson/provinces.ndjson",
      previewURL:
        "https://github.com/AmazingTool777-911/madagascar-administrative-boundaries/blob/main/data/ndjson/provinces.ndjson",
      isNDJSON: true,
    },
  ],
  [
    AdmLevelCode.REGION,
    {
      rawURL:
        "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/MDG/ADM1/geoBoundaries-MDG-ADM1.geojson",
      previewURL:
        "https://github.com/wmgeolab/geoBoundaries/blob/main/releaseData/gbOpen/MDG/ADM1/geoBoundaries-MDG-ADM1.geojson",
      isNDJSON: false,
    },
  ],
  [
    AdmLevelCode.DISTRICT,
    {
      rawURL:
        "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/MDG/ADM2/geoBoundaries-MDG-ADM2.geojson",
      previewURL:
        "https://github.com/wmgeolab/geoBoundaries/blob/main/releaseData/gbOpen/MDG/ADM2/geoBoundaries-MDG-ADM2.geojson",
      isNDJSON: false,
    },
  ],
  [
    AdmLevelCode.COMMUNE,
    {
      rawURL:
        "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/MDG/ADM3/geoBoundaries-MDG-ADM3.geojson",
      previewURL:
        "https://github.com/wmgeolab/geoBoundaries/blob/main/releaseData/gbOpen/MDG/ADM3/geoBoundaries-MDG-ADM3.geojson",
      isNDJSON: false,
    },
  ],
  [
    AdmLevelCode.FOKONTANY,
    {
      rawURL:
        "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/MDG/ADM4/geoBoundaries-MDG-ADM4.geojson",
      previewURL:
        "https://github.com/wmgeolab/geoBoundaries/blob/main/releaseData/gbOpen/MDG/ADM4/geoBoundaries-MDG-ADM4.geojson",
      isNDJSON: false,
    },
  ],
]);
