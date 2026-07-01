import {
  ADM_LEVEL_CODES_INDEXED,
  ADM_LEVEL_ENTRIES_COUNT_BY_CODE,
  ADM_LEVEL_TITLE_BY_CODE,
  AdmLevelCode,
} from "@scope/consts/models";

import AdmPill from "@/islands/AdmPill.tsx";
import { injectClientCacheIndexdDbConnection } from "@/client-cache/client-cache.indexeddb.ts";
import { injectAdmGeojsonClientCache } from "@/client-cache/adm-geojson.client-cache.ts";
import { injectAdmGeojsonStore } from "@/stores/adm-geojson.store.ts";
import { injectAppMapStore } from "@/stores/app-map.store.ts";
import { injectApiStore } from "@/stores/api.store.ts";
import { injectProvinceApi } from "@/api/province.api.ts";
import { injectRegionApi } from "@/api/region.api.ts";
import { injectDistrictApi } from "@/api/district.api.ts";
import { injectCommuneApi } from "@/api/commune.api.ts";
import { injectFokontanyApi } from "@/api/fokontany.api.ts";

export default function AdmExplorerPageCountsPills() {
  const indexedDb = injectClientCacheIndexdDbConnection();
  const admGeoJsonClientCache = injectAdmGeojsonClientCache(indexedDb);

  const admGeoJsonStore = injectAdmGeojsonStore();

  const apiStore = injectApiStore();
  const provinceApi = injectProvinceApi();
  const regionApi = injectRegionApi();
  const districtApi = injectDistrictApi();
  const communeApi = injectCommuneApi();
  const fokontanyApi = injectFokontanyApi();
  const appMapStore = injectAppMapStore(
    admGeoJsonClientCache,
    admGeoJsonStore,
    apiStore,
    provinceApi,
    regionApi,
    districtApi,
    communeApi,
    fokontanyApi,
  );

  async function handleClick(admLevelCode: AdmLevelCode) {
    await appMapStore.enableAdmGeoJsonLayer(admLevelCode, { fitBbox: true });
  }

  return (
    <ul class="m-0 p-0 list-none flex gap-2 flex-wrap">
      {ADM_LEVEL_CODES_INDEXED.map((admLevelCode) => {
        const pluralTitle = `${ADM_LEVEL_TITLE_BY_CODE.get(admLevelCode)!}s`;
        const count = ADM_LEVEL_ENTRIES_COUNT_BY_CODE.get(admLevelCode)!
          .toLocaleString("en-US");
        return (
          <li key={admLevelCode}>
            <AdmPill
              admLevelCode={admLevelCode}
              text={pluralTitle}
              title={`${count} ${pluralTitle}`}
              badge={count}
              onClick={handleClick}
            />
          </li>
        );
      })}
    </ul>
  );
}
