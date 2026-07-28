import AppMapTrackCurrentLocationFAB from "@/islands/AppMapTrackCurrentLocationFAB.tsx";
import AppMapPointOnMapFAB from "@/islands/AppMapPointOnMapFAB.tsx";
import AppMapManualCoordinatesEntryFAB from "@/islands/AppMapManualCoordinatesEntryFAB.tsx";
import { injectAdmGeojsonStore } from "@/stores/adm-geojson.store.ts";
import { injectClientCacheIndexdDbConnection } from "@/client-cache/client-cache.indexeddb.ts";
import { injectAdmGeojsonClientCache } from "@/client-cache/adm-geojson.client-cache.ts";
import { injectApiStore } from "@/stores/api.store.ts";
import { injectProvinceApi } from "@/api/province.api.ts";
import { injectRegionApi } from "@/api/region.api.ts";
import { injectDistrictApi } from "@/api/district.api.ts";
import { injectCommuneApi } from "@/api/commune.api.ts";
import { injectFokontanyApi } from "@/api/fokontany.api.ts";
import { injectAppMapStore } from "@/stores/app-map.store.ts";

export default function AppMapPinLocationActions() {
  const indexedDbConnection = injectClientCacheIndexdDbConnection();
  const admGeojsonClientCache = injectAdmGeojsonClientCache(
    indexedDbConnection,
  );
  const admGeojsonStore = injectAdmGeojsonStore();
  const apiStore = injectApiStore();
  const provinceApi = injectProvinceApi();
  const regionApi = injectRegionApi();
  const districtApi = injectDistrictApi();
  const communeApi = injectCommuneApi();
  const fokontanyApi = injectFokontanyApi();
  const appMapStore = injectAppMapStore(
    admGeojsonClientCache,
    admGeojsonStore,
    apiStore,
    provinceApi,
    regionApi,
    districtApi,
    communeApi,
    fokontanyApi,
  );
  const { mapIsLoaded } = appMapStore;

  return mapIsLoaded.value && (
    <aside
      id="app-map-pin-location-actions"
      class="fixed top-4 right-2 flex flex-col gap-y-2.5"
      style="z-index: calc(var(--base-z-index) + 10)"
    >
      <AppMapTrackCurrentLocationFAB />
      <AppMapPointOnMapFAB />
      <AppMapManualCoordinatesEntryFAB />
    </aside>
  );
}
