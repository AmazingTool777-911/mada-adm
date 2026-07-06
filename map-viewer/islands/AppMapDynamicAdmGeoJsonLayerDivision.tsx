import { useEffect } from "preact/hooks";
import {
  type AdmEntityDivisionWithEntry,
  injectAppMapStore,
} from "@/stores/app-map.store.ts";
import { injectApiStore } from "@/stores/api.store.ts";
import { injectProvinceApi } from "@/api/province.api.ts";
import { injectRegionApi } from "@/api/region.api.ts";
import { injectDistrictApi } from "@/api/district.api.ts";
import { injectCommuneApi } from "@/api/commune.api.ts";
import { injectFokontanyApi } from "@/api/fokontany.api.ts";
import { injectAdmGeojsonStore } from "@/stores/adm-geojson.store.ts";
import { injectAdmGeojsonClientCache } from "@/client-cache/adm-geojson.client-cache.ts";
import { injectClientCacheIndexdDbConnection } from "@/client-cache/client-cache.indexeddb.ts";

export type AppMapDynamicAdmGeoJsonLayerDivisionProps = {
  isRootEntry: boolean;
  division: AdmEntityDivisionWithEntry;
};

export default function AppMapDynamicAdmGeoJsonLayerDivision(
  { division, isRootEntry }: AppMapDynamicAdmGeoJsonLayerDivisionProps,
) {
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

  useEffect(() => {
    appMapStore.referenceAdmEntityGeoJsonEntryByName(
      division.admLevelCode,
      division.name,
      true,
    );
    return () => {
      const updatedEntry = appMapStore.referenceAdmEntityGeoJsonEntryByName(
        division.admLevelCode,
        division.name,
        false,
      );
      const minRefsCount = isRootEntry ? 0 : 1;
      if (updatedEntry && updatedEntry.refsCount <= minRefsCount) {
        appMapStore.renderAdmEntityGeoJsonEntryByName(
          updatedEntry.admEntityDiscriminated!.admLevelCode,
          updatedEntry.name,
          false,
        );
      }
    };
  }, []);

  return null;
}
