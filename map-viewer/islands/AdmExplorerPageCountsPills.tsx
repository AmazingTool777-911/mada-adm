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

export default function AdmExplorerPageCountsPill() {
  const indexedDb = injectClientCacheIndexdDbConnection();
  const admGeoJsonClientCache = injectAdmGeojsonClientCache(indexedDb);

  const admGeoJsonStore = injectAdmGeojsonStore();

  const appMapStore = injectAppMapStore(admGeoJsonClientCache, admGeoJsonStore);

  async function handleClick(admLevelCode: AdmLevelCode) {
    await appMapStore.enableAdmGeoJsonLayer(admLevelCode);
  }

  return (
    <ul class="m-0 p-0 list-none flex gap-2 flex-wrap">
      {ADM_LEVEL_CODES_INDEXED.map((admLevelCode) => (
        <li key={admLevelCode}>
          <AdmPill
            admLevelCode={admLevelCode}
            text={`${ADM_LEVEL_TITLE_BY_CODE.get(admLevelCode)!}s`}
            badge={ADM_LEVEL_ENTRIES_COUNT_BY_CODE.get(admLevelCode)!
              .toLocaleString("en-US")}
            onClick={handleClick}
          />
        </li>
      ))}
    </ul>
  );
}
