import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "preact/hooks";
import { useSignal, useSignalEffect } from "@preact/signals";

import { AdmLevelCode } from "@scope/consts/models";

import {
  INITIAL_MAP_CENTER,
  INITIAL_ZOOM,
  MAX_ZOOM,
  OFM_TILE_LAYER_STYLE_URL,
} from "@/consts/map.consts.ts";
import { injectAdmGeojsonStore } from "@/stores/adm-geojson.store.ts";
import { injectClientCacheIndexdDbConnection } from "@/client-cache/client-cache.indexeddb.ts";
import { injectAdmGeojsonClientCache } from "@/client-cache/adm-geojson.client-cache.ts";
import AppMapAdmGeoJsonDownloadModal from "@/islands/AppMapAdmGeoJsonDownloadModal.tsx";
import { AdmGeojsonMetadataClientCacheItem } from "@/types/cache.d.ts";
import { injectAppMapStore } from "@/stores/app-map.store.ts";
import { LayerSwitcherControl } from "@/helpers/map-layer-switch-control.helper.ts";
import { injectAdmEntityApi } from "@/api/adm-entity.api.ts";
import { injectApiStore } from "@/stores/api.store.ts";

export type AppMapProps = {
  admGeojsonDataVersionByCode: Map<AdmLevelCode, number>;
};

export default function AppMap(props: AppMapProps) {
  const indexedDb = injectClientCacheIndexdDbConnection();
  const admGeoJsonClientCache = injectAdmGeojsonClientCache(indexedDb);

  const admGeoJsonStore = injectAdmGeojsonStore();

  useEffect(() => {
    syncExistingAdmGeoJsonData();
  }, []);

  async function syncExistingAdmGeoJsonData() {
    admGeoJsonStore.admGeoJsonDataVersionByCode.value =
      props.admGeojsonDataVersionByCode;

    const admGeoJsonMetadata = await admGeoJsonClientCache.getAllMetadata();

    admGeoJsonStore.cachedMetadata.value = admGeoJsonMetadata;
    admGeoJsonStore.cachedMetadataIsLoaded.value = true;

    const updatableCachedMetadata = admGeoJsonStore.cachedMetadata
      .value.filter((m) => {
        return m.version <
          props.admGeojsonDataVersionByCode.get(
            m.admLevelCode,
          )!;
      });
    if (updatableCachedMetadata.length > 0) {
      admGeoJsonStore.upsertAdmGeojsonDataDownloadsToast({
        type: "warning",
        notification: "updates-available",
        admLevelCodes: updatableCachedMetadata.map((m) => m.admLevelCode),
      });
    }
  }

  const mapContainerRef = useRef<HTMLDivElement>(null);

  const appMapStore = injectAppMapStore(admGeoJsonClientCache, admGeoJsonStore);

  const mapRef = useRef<maplibregl.Map>();
  const mapLayerSwitcherControlRef = useRef<LayerSwitcherControl>();
  const mapIsLoaded = useSignal(false);

  useEffect(() => {
    const map = new maplibregl.Map({
      style: OFM_TILE_LAYER_STYLE_URL,
      center: INITIAL_MAP_CENTER,
      zoom: INITIAL_ZOOM,
      maxZoom: MAX_ZOOM,
      container: mapContainerRef.current!,
    });
    appMapStore.map.value = map;

    const layerSwitcher = new LayerSwitcherControl(map, {
      onAdmGeoJsonLayerCheckoxChange: handleAdmGeoJsonLayerCheckoxChange,
      admGeoJsonLayersCheckboxesStates:
        appMapStore.admGeoJsonLayersCheckboxesStates,
    });
    mapLayerSwitcherControlRef.current = layerSwitcher;
    appMapStore.mapLayerSwitcherControl.value = layerSwitcher;
    map.addControl(layerSwitcher, "bottom-left");

    mapRef.current = map;
    map.on("load", () => {
      mapIsLoaded.value = true;
    });

    return () => {
      layerSwitcher.onRemove();
      map.remove();
    };
  }, []);

  async function handleAdmGeoJsonLayerCheckoxChange(
    admLevelCode: AdmLevelCode,
    checked: boolean,
  ) {
    const checkboxState = appMapStore.admGeoJsonLayersCheckboxesStates.value
      .find(
        (d) => d.code === admLevelCode,
      );
    if (checkboxState && checkboxState.checked === "loading") return;
    if (!checked) {
      appMapStore.checkAdmGeoJsonLayer(admLevelCode, false);
      if (
        mapLayerSwitcherControlRef.current?.hasStaticAdmGeoJsonLayer(
          admLevelCode,
        )
      ) {
        mapLayerSwitcherControlRef.current?.removeStaticAdmGeoJsonLayer(
          admLevelCode,
        );
      }
      return;
    }
    await appMapStore.enableAdmGeoJsonLayer(admLevelCode);
  }

  useSignalEffect(() => {
    if (!admGeoJsonStore.downloadModalIsOpen.value) {
      for (
        const checkboxState of appMapStore.admGeoJsonLayersCheckboxesStates
          .value
      ) {
        if (checkboxState.checked === true) {
          if (
            !admGeoJsonStore.cachedMetadataCodes.value.has(checkboxState.code)
          ) {
            if (
              !admGeoJsonStore.downloadByAdmLevelCode.value.has(
                checkboxState.code,
              )
            ) {
              appMapStore.checkAdmGeoJsonLayer(checkboxState.code, false);
            } else if (
              ["idle", "downloading"].includes(
                admGeoJsonStore.downloadByAdmLevelCode.value.get(
                  checkboxState.code,
                )!.status,
              )
            ) {
              appMapStore.checkAdmGeoJsonLayer(checkboxState.code, "loading");
            }
          }
        }
      }
    }
  });

  useSignalEffect(() => {
    handleAdmGeoJsonDownloadsResolved();
  });

  async function handleAdmGeoJsonDownloadsResolved() {
    for (const download of admGeoJsonStore.downloads.value) {
      if (download.status !== "success" && download.status !== "failed") {
        continue;
      }
      if (download.status === "success" && !download.geojson) continue;
      const checkboxState = appMapStore.admGeoJsonLayersCheckboxesStates.value
        .find(
          (d) => d.code === download.admLevelCode,
        )!;
      if (download.status === "failed") {
        if (checkboxState.checked === "loading") {
          appMapStore.checkAdmGeoJsonLayer(checkboxState.code, false);
        }
        continue;
      }
      const cachedMetadata = admGeoJsonStore.cachedMetadata.value.find(
        (metadata) => metadata.admLevelCode === download.admLevelCode,
      );
      const metadata: AdmGeojsonMetadataClientCacheItem = {
        admLevelCode: download.admLevelCode,
        version: props.admGeojsonDataVersionByCode.get(
          download.admLevelCode,
        )!,
        lastModified: new Date(),
      };
      await admGeoJsonClientCache.upsert({
        ...metadata,
        geojson: download.geojson!,
      });
      admGeoJsonStore.upsertCachedMetadata(metadata);
      if (!cachedMetadata) {
        appMapStore.checkAdmGeoJsonLayer(download.admLevelCode, true);
        mapLayerSwitcherControlRef.current?.addStaticAdmGeoJsonLayer(
          download.admLevelCode,
          download.geojson!,
        );
      } else if (
        mapLayerSwitcherControlRef.current?.hasStaticAdmGeoJsonLayer(
          download.admLevelCode,
        )
      ) {
        mapLayerSwitcherControlRef.current?.removeStaticAdmGeoJsonLayer(
          download.admLevelCode,
        );
        mapLayerSwitcherControlRef.current?.addStaticAdmGeoJsonLayer(
          download.admLevelCode,
          download.geojson!,
        );
      }
      delete download.geojson; // Free the reference to the geojson data from memory
    }
  }

  const apiStore = injectApiStore();

  const admEntityApi = injectAdmEntityApi();

  useEffect(() => {
    admEntityApi.getAllInBatch()
      .then((batch) => {
        const [adm0, adm1, adm2, adm3, adm4] = batch;
        apiStore.provinces.value = adm0.provinces;
        apiStore.regions.value = adm1.regions;
        apiStore.districtsAreLoaded.value = true;
        apiStore.districts.value = adm2.paginatedDistricts.records;
        apiStore.communesAreLoaded.value = true;
        apiStore.communes.value = adm3.paginatedCommunes.records;
        apiStore.fokontanysAreLoaded.value = true;
        apiStore.fokontanys.value = adm4.paginatedFokontanys.records;
        apiStore.initialAdmEntitiesAreLoaded.value = true;
      })
      .catch((e) => console.log(e));
  }, []);

  return (
    <>
      {/* Map container */}
      <div ref={mapContainerRef} class="h-full w-full"></div>
      {/* Confirm ADM GeoJSON data download modal */}
      <AppMapAdmGeoJsonDownloadModal />
    </>
  );
}
