import { signal } from "@preact/signals";
import { AdmGeoJsonLayerCheckedState } from "@/types/app-map.d.ts";
import { ADM_LEVEL_CODES_INDEXED, AdmLevelCode } from "@scope/consts/models";
import { AdmGeojsonClientCache } from "@/client-cache/adm-geojson.client-cache.ts";
import { AdmGeojsonMetadataClientCacheItem } from "@/types/cache.d.ts";
import { AdmGeoJsonStore } from "@/stores/adm-geojson.store.ts";
import { LayerSwitcherControl } from "@/helpers/map-layer-switch-control.helper.ts";

export class AppMapStore {
  constructor(
    private admGeoJsonClientCache: AdmGeojsonClientCache,
    private admGeoJsonStore: AdmGeoJsonStore,
  ) {}

  readonly map = signal<maplibregl.Map | null>(null);
  readonly mapIsLoaded = signal(false);
  readonly mapLayerSwitcherControl = signal<LayerSwitcherControl | null>(null);

  readonly admGeoJsonLayersCheckboxesStates = signal<
    AdmGeoJsonLayerCheckedState[]
  >(ADM_LEVEL_CODES_INDEXED.map((admLevelCode) => ({
    code: admLevelCode,
    checked: false,
    isFirstTime: true,
  })));

  checkAdmGeoJsonLayer(
    admLevelCode: AdmLevelCode,
    checked: boolean | "loading",
  ) {
    const i = this.admGeoJsonLayersCheckboxesStates.value.findIndex(
      (d) => d.code === admLevelCode,
    );
    if (i >= 0) {
      const checkboxData = {
        ...this.admGeoJsonLayersCheckboxesStates.value[i],
        checked,
        isFirstTime: false,
      };
      this.admGeoJsonLayersCheckboxesStates.value[i] = checkboxData;
      this.admGeoJsonLayersCheckboxesStates.value = [
        ...this.admGeoJsonLayersCheckboxesStates.value,
      ];
    }
  }

  async enableAdmGeoJsonLayer(admLevelCode: AdmLevelCode) {
    let admGeoJsonMetadata: AdmGeojsonMetadataClientCacheItem | null =
      this.admGeoJsonStore.cachedMetadata.value.find((metadata) =>
        metadata.admLevelCode === admLevelCode
      ) ?? null;
    if (!admGeoJsonMetadata) {
      this.checkAdmGeoJsonLayer(admLevelCode, "loading");
      admGeoJsonMetadata = await this.admGeoJsonClientCache.getMetadataByCode(
        admLevelCode,
      );
      if (admGeoJsonMetadata) {
        this.admGeoJsonStore.upsertCachedMetadata({ ...admGeoJsonMetadata });
      }
    }
    if (!admGeoJsonMetadata) {
      this.checkAdmGeoJsonLayer(admLevelCode, true);
      await this.admGeoJsonStore.openDownloadModal([admLevelCode]);
    } else {
      const isFirstTimeChecked =
        this.admGeoJsonLayersCheckboxesStates.value.find((state) =>
          state.code === admLevelCode
        )!.isFirstTime;
      this.checkAdmGeoJsonLayer(admLevelCode, true);
      // TODO: Add GeoJSON to the map
      const geojsonData = await this.admGeoJsonClientCache.getGeojsonByCode(
        admGeoJsonMetadata.admLevelCode,
      );
      if (
        geojsonData &&
        !this.mapLayerSwitcherControl.value?.hasStaticAdmGeoJsonLayer(
          admGeoJsonMetadata.admLevelCode,
        )
      ) {
        this.mapLayerSwitcherControl.value?.addStaticAdmGeoJsonLayer(
          admGeoJsonMetadata.admLevelCode,
          geojsonData.geojson,
          { fitBbox: isFirstTimeChecked },
        );
      }
    }
  }
}

let appMapStore: AppMapStore | null = null;

export function injectAppMapStore(
  admGeoJsonClientCache: AdmGeojsonClientCache,
  admGeoJsonStore: AdmGeoJsonStore,
) {
  return appMapStore ??= new AppMapStore(
    admGeoJsonClientCache,
    admGeoJsonStore,
  );
}
