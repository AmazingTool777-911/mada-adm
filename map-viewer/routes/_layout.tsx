import { define } from "../utils.ts";
import BaseMap from "@/islands/BaseMap.tsx";
import { AdmLevelCode } from "@scope/consts/models";

export default define.layout(({ Component }) => {
  const admGeojsonDataVersionByCode = new Map<AdmLevelCode, number>([
    [
      AdmLevelCode.PROVINCE,
      Deno.env.has("PROVINCE_ADM_GEOJSON_VERSION")
        ? parseInt(Deno.env.get("PROVINCE_ADM_GEOJSON_VERSION") as string)
        : 1,
    ],
    [
      AdmLevelCode.REGION,
      Deno.env.has("REGION_ADM_GEOJSON_VERSION")
        ? parseInt(Deno.env.get("REGION_ADM_GEOJSON_VERSION") as string)
        : 1,
    ],
    [
      AdmLevelCode.DISTRICT,
      Deno.env.has("DISTRICT_ADM_GEOJSON_VERSION")
        ? parseInt(Deno.env.get("DISTRICT_ADM_GEOJSON_VERSION") as string)
        : 1,
    ],
    [
      AdmLevelCode.COMMUNE,
      Deno.env.has("COMMUNE_ADM_GEOJSON_VERSION")
        ? parseInt(Deno.env.get("COMMUNE_ADM_GEOJSON_VERSION") as string)
        : 1,
    ],
    [
      AdmLevelCode.FOKONTANY,
      Deno.env.has("FOKONTANY_ADM_GEOJSON_VERSION")
        ? parseInt(Deno.env.get("FOKONTANY_ADM_GEOJSON_VERSION") as string)
        : 1,
    ],
  ]);

  return (
    <div class="w-screen h-screen">
      <Component />
      <div className="w-full h-full">
        <BaseMap admGeojsonDataVersionByCode={admGeojsonDataVersionByCode} />
      </div>
    </div>
  );
});
