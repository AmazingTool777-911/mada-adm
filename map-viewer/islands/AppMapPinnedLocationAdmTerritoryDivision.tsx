import { useEffect } from "preact/hooks";
import { injectClientCacheIndexdDbConnection } from "@/client-cache/client-cache.indexeddb.ts";
import { injectAdmGeojsonClientCache } from "@/client-cache/adm-geojson.client-cache.ts";
import { injectAdmGeojsonStore } from "@/stores/adm-geojson.store.ts";
import { injectApiStore } from "@/stores/api.store.ts";
import { injectProvinceApi } from "@/api/province.api.ts";
import { injectRegionApi } from "@/api/region.api.ts";
import { injectDistrictApi } from "@/api/district.api.ts";
import { injectCommuneApi } from "@/api/commune.api.ts";
import { injectFokontanyApi } from "@/api/fokontany.api.ts";
import {
  AdmEntityDivisionWithEntry,
  injectAppMapStore,
} from "@/stores/app-map.store.ts";

export type AppMapPinnedLocationBeaconAdmTerritoryDivisionProps = {
  division: AdmEntityDivisionWithEntry;
};

export default function AppMapPinnedLocationBeaconAdmTerritoryDivision(
  { division }: AppMapPinnedLocationBeaconAdmTerritoryDivisionProps,
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
      if (updatedEntry && updatedEntry.refsCount === 1) {
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
