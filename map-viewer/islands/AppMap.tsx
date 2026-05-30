import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "preact/hooks";
import { Signal, useSignal, useSignalEffect } from "@preact/signals";

import {
  ADM_LEVEL_CODES_INDEXED,
  ADM_LEVEL_TITLE_BY_CODE,
  AdmLevelCode,
} from "@scope/consts/models";

import {
  CARTO_DB_TILE_LAYER_DATA,
  ESRI_TILE_LAYER_DATA,
  INITIAL_MAP_CENTER,
  INITIAL_ZOOM,
  MAX_ZOOM,
  OFM_TILE_LAYER_STYLE_URL,
  TILE_SIZE,
} from "@/consts/map.consts.ts";
import { injectAdmGeojsonStore } from "@/stores/adm-geojson.store.ts";
import { injectClientCacheIndexdDbConnection } from "@/client-cache/client-cache.indexeddb.ts";
import { injectAdmGeojsonClientCache } from "@/client-cache/adm-geojson.client-cache.ts";
import AppMapAdmGeoJsonDownloadModal from "@/islands/AppMapAdmGeoJsonDownloadModal.tsx";
import { AdmGeojsonMetadataClientCacheItem } from "@/types/cache.d.ts";

export type AppMapProps = {
  admGeojsonDataVersionByCode: Map<AdmLevelCode, number>;
};

type AdmGeoJsonLayerCheckedState = {
  code: AdmLevelCode;
  checked: boolean | "loading";
};

export default function AppMap(props: AppMapProps) {
  const indexedDb = injectClientCacheIndexdDbConnection();
  const admGeoJsonClientCache = injectAdmGeojsonClientCache(indexedDb);

  const admGeoJsonStore = injectAdmGeojsonStore();

  useEffect(() => {
    syncExistingAdmGeoJsonData();
  }, []);

  async function syncExistingAdmGeoJsonData() {
    const admGeoJsonMetadata = await admGeoJsonClientCache.getAllMetadata();

    admGeoJsonStore.cachedMetadata.value = admGeoJsonMetadata;

    const admGeoJsonToBeUpdated = admGeoJsonMetadata.filter((metadata) => {
      return metadata.version <
        props.admGeojsonDataVersionByCode.get(metadata.admLevelCode)!;
    });
    if (admGeoJsonToBeUpdated.length === 0) return;
    await Promise.all(admGeoJsonToBeUpdated.map((metadata) => {
      return admGeoJsonStore.downloadForAdmLevel(metadata.admLevelCode);
    }));
  }

  useEffect(() => {
    console.log(
      "downloads",
      admGeoJsonStore.downloads.value,
    );
  }, [admGeoJsonStore.downloads.value]);

  const mapContainerRef = useRef<HTMLDivElement>(null);

  const admGeoJsonLayersCheckboxesStates = useSignal<
    AdmGeoJsonLayerCheckedState[]
  >(
    ADM_LEVEL_CODES_INDEXED.map((code) => ({
      code,
      checked: false,
    })),
  );

  function checkAdmGeoJsonLayer(
    admLevelCode: AdmLevelCode,
    checked: boolean | "loading",
  ) {
    const i = admGeoJsonLayersCheckboxesStates.value.findIndex(
      (d) => d.code === admLevelCode,
    );
    if (i >= 0) {
      const checkboxData = {
        ...admGeoJsonLayersCheckboxesStates.value[i],
        checked,
      };
      admGeoJsonLayersCheckboxesStates.value[i] = checkboxData;
      admGeoJsonLayersCheckboxesStates.value = [
        ...admGeoJsonLayersCheckboxesStates.value,
      ];
    }
  }

  useEffect(() => {
    const map = new maplibregl.Map({
      style: OFM_TILE_LAYER_STYLE_URL,
      center: INITIAL_MAP_CENTER,
      zoom: INITIAL_ZOOM,
      maxZoom: MAX_ZOOM,
      container: mapContainerRef.current!,
    });

    const layerSwitcher = new LayerSwitcherControl(map, {
      onAdmGeoJsonLayerCheckoxChange: handleAdmGeoJsonLayerCheckoxChange,
      admGeoJsonLayersCheckboxesStates,
    });
    map.addControl(layerSwitcher, "bottom-left");

    return () => {
      layerSwitcher.onRemove();
      map.remove();
    };
  }, []);

  async function handleAdmGeoJsonLayerCheckoxChange(
    admLevelCode: AdmLevelCode,
    checked: boolean,
  ) {
    const checkboxState = admGeoJsonLayersCheckboxesStates.value.find(
      (d) => d.code === admLevelCode,
    );
    if (checkboxState && checkboxState.checked === "loading") return;
    if (!checked) {
      checkAdmGeoJsonLayer(admLevelCode, false);
      return;
    }
    let admGeoJsonMetadata: AdmGeojsonMetadataClientCacheItem | null =
      admGeoJsonStore.cachedMetadata.value.find((metadata) =>
        metadata.admLevelCode === admLevelCode
      ) ?? null;
    if (!admGeoJsonMetadata) {
      checkAdmGeoJsonLayer(admLevelCode, "loading");
      admGeoJsonMetadata = await admGeoJsonClientCache.getMetadataByCode(
        admLevelCode,
      );
      if (admGeoJsonMetadata) {
        admGeoJsonStore.upsertCachedMetadata({ ...admGeoJsonMetadata });
      }
    }
    if (!admGeoJsonMetadata) {
      checkAdmGeoJsonLayer(admLevelCode, true);
      await admGeoJsonStore.openDownloadModal([admLevelCode]);
    } else {
      checkAdmGeoJsonLayer(admLevelCode, true);
      // TODO: Add GeoJSON to the map
    }
  }

  useSignalEffect(() => {
    if (!admGeoJsonStore.downloadModalIsOpen.value) {
      for (const checkboxState of admGeoJsonLayersCheckboxesStates.value) {
        if (checkboxState.checked === true) {
          if (
            !admGeoJsonStore.cachedMetadataCodes.value.has(checkboxState.code)
          ) {
            if (
              !admGeoJsonStore.downloadByAdmLevelCode.value.has(
                checkboxState.code,
              )
            ) {
              checkAdmGeoJsonLayer(checkboxState.code, false);
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
      const checkboxState = admGeoJsonLayersCheckboxesStates.value.find(
        (d) => d.code === download.admLevelCode,
      )!;
      if (download.status === "failed") {
        if (checkboxState.checked === "loading") {
          checkAdmGeoJsonLayer(checkboxState.code, false);
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
        checkAdmGeoJsonLayer(download.admLevelCode, true);
      }
      // TODO: Add GeoJSON to the map
    }
  }

  return (
    <>
      {/* Map container */}
      <div ref={mapContainerRef} class="h-full w-full"></div>
      {/* Confirm ADM GeoJSON data download modal */}
      <AppMapAdmGeoJsonDownloadModal />
    </>
  );
}

type LayerSwitcherControlOptions = {
  onAdmGeoJsonLayerCheckoxChange: (
    admLevelCode: AdmLevelCode,
    checked: boolean,
  ) => void;
  admGeoJsonLayersCheckboxesStates: Signal<AdmGeoJsonLayerCheckedState[]>;
};

class LayerSwitcherControl implements maplibregl.IControl {
  private container!: HTMLElement;
  private map: maplibregl.Map;
  private satelliteLoaded = false;

  private onAdmGeoJsonLayerCheckoxChange:
    LayerSwitcherControlOptions["onAdmGeoJsonLayerCheckoxChange"];
  private admGeoJsonLayersCheckboxesStatesSubscriber!: () => void;

  private admGeoJsonLayersChecboxesByCode?: Map<
    AdmLevelCode,
    HTMLInputElement
  >;

  constructor(map: maplibregl.Map, options: LayerSwitcherControlOptions) {
    this.map = map;
    this.onAdmGeoJsonLayerCheckoxChange = options
      ?.onAdmGeoJsonLayerCheckoxChange;

    this.admGeoJsonLayersCheckboxesStatesSubscriber = options
      .admGeoJsonLayersCheckboxesStates
      .subscribe((states) => {
        if (!this.admGeoJsonLayersChecboxesByCode) return;
        for (const state of states) {
          const checkbox = this.admGeoJsonLayersChecboxesByCode.get(
            state.code,
          )!;
          if (
            typeof state.checked === "boolean" &&
            checkbox.checked !== state.checked
          ) {
            checkbox.checked = state.checked;
            checkbox.indeterminate = false;
          } else if (state.checked === "loading") {
            checkbox.indeterminate = true;
          } else {
            checkbox.indeterminate = false;
          }
        }
      });
  }

  onAdd(map: maplibregl.Map) {
    this.map = map;

    this.container = document.createElement("div");
    this.container.className =
      "maplibregl-ctrl maplibregl-ctrl-group layer-switcher";
    this.container.style.marginLeft = "12px";
    const admBoundariesInputName = "adm-level-boundaries";
    const admBoundariesCheckboxesHTML = ADM_LEVEL_CODES_INDEXED.map((code) => {
      const title = ADM_LEVEL_TITLE_BY_CODE.get(code);
      const id = admBoundariesInputName + "-" + code;
      return `
        <li>
          <label for="${id}">
            <input type="checkbox" name="${admBoundariesInputName}" value="${code}" id="${id}" class="checkbox checkbox-primary checkbox-xs" />
            <div class="flex">
              ${code}: <span class="capitalize">${title}s</span>
            </div>
          </label>
        </li>
      `;
    }).join("");
    const baseTileLayerInputName = "map-base-tile";
    this.container.innerHTML = `
      <div>
        <div class="tooltip tooltip-right" data-tip="Map layers">
          <div>
            <div class="dropdown dropdown-top dropdown-start">
              <div tabindex="0" role="button" class="btn btn-square m-1 text-base-content/90 hover:text-base-content duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers-icon lucide-layers"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg>
              </div>
              <div tabindex="-1" class="dropdown-content bg-base-100 rounded-box z-1 w-52 shadow-sm">
                <ul class="menu menu-sm w-full">
                  <li class="menu-title text-xs">Administrative boundaries</li>
                  ${admBoundariesCheckboxesHTML}
                </ul>
                <ul class="menu menu-sm w-full">
                  <li class="menu-title text-xs">View</li>
                  <li>
                    <label for="map-base-tile-vector">
                      <input type="radio" name="${baseTileLayerInputName}" value="vector" id="map-base-tile-vector" class="radio radio-xs radio-primary" checked="checked" />
                      Vector
                    </label>
                  </li>
                  <li>
                    <label for="map-base-tile-satellite">
                      <input type="radio" name="${baseTileLayerInputName}" value="satellite" id="map-base-tile-satellite" class="radio radio-xs radio-primary" />
                      Satellite
                    </label>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Base tile layer radio change
    this.container.querySelectorAll<HTMLInputElement>(
      `input[name="${baseTileLayerInputName}"]`,
    ).forEach((radio) => {
      radio.addEventListener("change", () => {
        this.setMode(radio.value as "vector" | "satellite");
      });
    });

    // Adm geojson layer checkboxes
    const admGeoJsonLayerCheckboxes = this.container.querySelectorAll<
      HTMLInputElement
    >(
      `input[name|="${admBoundariesInputName}"]`,
    );
    this.admGeoJsonLayersChecboxesByCode = new Map();
    for (const input of admGeoJsonLayerCheckboxes) {
      const code = input.value as AdmLevelCode;
      this.admGeoJsonLayersChecboxesByCode.set(code, input);
      input.addEventListener("change", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onAdmGeoJsonLayerCheckoxChange(
          code,
          input.checked,
        );
      }, { capture: true });
    }

    return this.container;
  }

  private setMode(mode: "vector" | "satellite") {
    if (mode === "satellite" && !this.satelliteLoaded) {
      this.map.addSource(ESRI_TILE_LAYER_DATA.SOURCE, {
        type: "raster",
        tiles: [ESRI_TILE_LAYER_DATA.URL_TEMPLATE],
        tileSize: TILE_SIZE,
        attribution: ESRI_TILE_LAYER_DATA.ATTRIBUTION,
      });
      this.map.addSource(CARTO_DB_TILE_LAYER_DATA.SOURCE, {
        type: "raster",
        tiles: ["a", "b", "c"].map((_) =>
          CARTO_DB_TILE_LAYER_DATA.URL_TEMPLATE.replace("{s}", _)
        ),
        tileSize: TILE_SIZE,
        attribution: CARTO_DB_TILE_LAYER_DATA.ATTRIBUTION,
      });
      this.map.addLayer(
        {
          id: ESRI_TILE_LAYER_DATA.LAYER_ID,
          type: "raster",
          source: ESRI_TILE_LAYER_DATA.SOURCE,
        },
        this.map.getStyle().layers[0].id, // insert below all Liberty layers
      );
      this.map.addLayer({
        id: CARTO_DB_TILE_LAYER_DATA.LAYER_ID,
        type: "raster",
        source: CARTO_DB_TILE_LAYER_DATA.SOURCE,
      });
      this.satelliteLoaded = true;
    }

    // Toggle Liberty layers
    for (const layer of this.map.getStyle().layers) {
      if (
        layer.id !== ESRI_TILE_LAYER_DATA.LAYER_ID &&
        layer.id !== CARTO_DB_TILE_LAYER_DATA.LAYER_ID
      ) {
        this.map.setLayoutProperty(
          layer.id,
          "visibility",
          mode === "vector" ? "visible" : "none",
        );
      }
    }

    // Toggle satellite layers
    if (this.satelliteLoaded) {
      this.map.setLayoutProperty(
        ESRI_TILE_LAYER_DATA.LAYER_ID,
        "visibility",
        mode === "satellite" ? "visible" : "none",
      );
      this.map.setLayoutProperty(
        CARTO_DB_TILE_LAYER_DATA.LAYER_ID,
        "visibility",
        mode === "satellite" ? "visible" : "none",
      );
    }
  }

  onRemove() {
    this.container.remove();
    this.admGeoJsonLayersCheckboxesStatesSubscriber();
  }
}
