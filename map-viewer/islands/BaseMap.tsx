import { useRef } from "preact/hooks";
import { useEffect } from "preact/hooks";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";
import libGeoJSONVT from "geojson-vt";
import {
  ADM_GEOJSON_OVERLAY_PANE,
  CARTO_DB_PANE,
  CARTO_DB_TILE_LAYER_DATA,
  ESRI_TILE_LAYER_DATA,
  INITIAL_MAP_CENTER,
  INITIAL_ZOOM,
  MAX_ZOOM,
  OSM_TILE_LAYER_DATA,
} from "@/consts/base-map.consts.ts";
import {
  admGeojsonData,
  admGeojsonDataActiveDownloads,
  admGeojsonDataVersionByCode,
} from "@/stores/adm-geojson.store.ts";
import {
  ADM_LEVEL_CODES_INDEXED,
  ADM_LEVEL_INDEX_BY_CODE,
  ADM_LEVEL_TITLE_BY_CODE,
  AdmLevelCode,
} from "@scope/consts/models";
import useSyncAdmGeojsonData from "@/hooks/useSyncAdmGeojsonData.ts";

declare global {
  var geojsonvt: typeof libGeoJSONVT;
}

export interface BaseMapProps {
  admGeojsonDataVersionByCode: Map<AdmLevelCode, number>;
}

function getAdmGeojsonLayerLabel(code: AdmLevelCode) {
  const title = ADM_LEVEL_TITLE_BY_CODE.get(code)!;
  return `${code}: ${title.charAt(0).toUpperCase() + title.slice(1)}s`;
}

export default function BaseMap(props: BaseMapProps) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapLayerControlsRef = useRef<L.Control.Layers | null>(null);

  const admGeojsonLayersByCodeRef = useRef<
    Map<AdmLevelCode, L.GeoJSON<unknown>>
  >();
  const emptyGeojsonLayersByCodeRef = useRef<
    Map<AdmLevelCode, L.GeoJSON<unknown>>
  >();

  admGeojsonDataVersionByCode.value = props.admGeojsonDataVersionByCode;

  useEffect(() => {
    if (!mapEl.current) return;
    initMap();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    let L!: typeof import("leaflet");
    import("leaflet").then(({ default: importedL }) => {
      L = importedL;
      return import("leaflet-geojson-vt/src/leaflet-geojson-vt.js");
    }).then(() => {
      admGeojsonData.value
        .filter((item) =>
          item.version <
            admGeojsonDataVersionByCode.value!.get(item.admLevelCode)! &&
          !admGeojsonDataActiveDownloads.value.find((downloadItem) =>
            downloadItem.admLevelCode === item.admLevelCode
          )
        )
        .forEach(async (item) => {
          const admGeojsonDataItem = await syncAdmGeojsonDataForCode(
            item.admLevelCode,
          );
          const prevLayer = admGeojsonLayersByCodeRef.current?.get(
            item.admLevelCode,
          )!;
          if (
            prevLayer &&
            mapLayerControlsRef.current
          ) {
            mapRef.current!.removeLayer(prevLayer);
            mapLayerControlsRef.current.removeLayer(prevLayer);
          }
          if (emptyGeojsonLayersByCodeRef.current?.has(item.admLevelCode)) {
            mapRef.current!.removeLayer(
              emptyGeojsonLayersByCodeRef.current?.get(item.admLevelCode)!,
            );
            mapLayerControlsRef.current?.removeLayer(
              emptyGeojsonLayersByCodeRef.current?.get(item.admLevelCode)!,
            );
            emptyGeojsonLayersByCodeRef.current?.delete(item.admLevelCode);
          }
          const newLayer = L.geoJson.vt(admGeojsonDataItem.geojson, {
            pane: ADM_GEOJSON_OVERLAY_PANE.NAME,
            maxZoom: MAX_ZOOM,
            tolerance: 1,
            style: {
              fillColor: "#3388ff",
              color: "#3388ff",
              fillOpacity: 0.35,
              opacity: 0.8,
              weight: 2,
            },
          });
          newLayer.setZIndex(ADM_LEVEL_INDEX_BY_CODE.get(item.admLevelCode)!);
          mapRef.current!.addLayer(newLayer);
          mapLayerControlsRef.current?.addOverlay(
            newLayer,
            getAdmGeojsonLayerLabel(item.admLevelCode),
          );
        });
    });
  }, [admGeojsonData.value]);

  useEffect(() => {
    if (!mapRef.current) return;
    let L!: typeof import("leaflet");
    const admGeojsonDataWithoutLayers = admGeojsonData.value.filter((item) =>
      !admGeojsonLayersByCodeRef.current?.get(item.admLevelCode)
    );
    import("leaflet").then(({ default: importedL }) => {
      L = importedL;
      return import("leaflet-geojson-vt/src/leaflet-geojson-vt.js");
    }).then(() => {
      admGeojsonDataWithoutLayers.forEach((item) => {
        if (emptyGeojsonLayersByCodeRef.current?.has(item.admLevelCode)) {
          mapRef.current!.removeLayer(
            emptyGeojsonLayersByCodeRef.current?.get(item.admLevelCode)!,
          );
          mapLayerControlsRef.current?.removeLayer(
            emptyGeojsonLayersByCodeRef.current?.get(item.admLevelCode)!,
          );
          emptyGeojsonLayersByCodeRef.current?.delete(item.admLevelCode);
        }
        const newLayer = L.geoJson.vt(item.geojson, {
          pane: ADM_GEOJSON_OVERLAY_PANE.NAME,
          maxZoom: MAX_ZOOM,
          tolerance: 1,
          style: {
            fillColor: "#3388ff",
            color: "#3388ff",
            fillOpacity: 0.35,
            opacity: 0.8,
            weight: 2,
          },
        });
        newLayer.setZIndex(ADM_LEVEL_INDEX_BY_CODE.get(item.admLevelCode)!);
        mapRef.current!.addLayer(newLayer);
        mapLayerControlsRef.current?.addOverlay(
          newLayer,
          getAdmGeojsonLayerLabel(item.admLevelCode),
        );
        admGeojsonLayersByCodeRef.current?.set(item.admLevelCode, newLayer);
      });
    });
  }, [admGeojsonData.value]);

  const { syncAdmGeojsonDataForCode } = useSyncAdmGeojsonData();

  async function initMap() {
    const { default: L } = await import("leaflet");
    globalThis.geojsonvt = libGeoJSONVT;
    await import("leaflet-geojson-vt/src/leaflet-geojson-vt.js");

    await new Promise((res) => setTimeout(res, 2000));

    const osmLayer = L.tileLayer(
      OSM_TILE_LAYER_DATA.URL_TEMPLATE,
      {
        maxZoom: MAX_ZOOM,
        attribution: OSM_TILE_LAYER_DATA.ATTRIBUTION,
      },
    );

    const esriLayer = L.tileLayer(
      ESRI_TILE_LAYER_DATA.URL_TEMPLATE,
      {
        maxZoom: MAX_ZOOM,
        attribution: ESRI_TILE_LAYER_DATA.ATTRIBUTION,
      },
    );

    mapRef.current = L.map(mapEl.current!, {
      center: INITIAL_MAP_CENTER,
      zoom: INITIAL_ZOOM,
      zoomControl: false,
      attributionControl: true,
      layers: [osmLayer],
      // renderer: L.canvas(),
    });

    // Esri satellite imagery tiles + CartoDB labels tiles
    const satelliteTileLayerLabel =
      `${ESRI_TILE_LAYER_DATA.LABEL}, ${CARTO_DB_TILE_LAYER_DATA.LABEL}`;

    const baseLayers = {
      [OSM_TILE_LAYER_DATA.LABEL]: osmLayer,
      [satelliteTileLayerLabel]: esriLayer,
    };
    admGeojsonLayersByCodeRef.current = new Map<
      AdmLevelCode,
      L.GeoJSON<unknown>
    >(
      admGeojsonData.value.map((item) => {
        const layer = L.geoJson.vt(item.geojson, {
          pane: ADM_GEOJSON_OVERLAY_PANE.NAME,
          maxZoom: MAX_ZOOM,
          tolerance: 1,
          style: {
            fillColor: "#3388ff",
            color: "#3388ff",
            fillOpacity: 0.35,
            opacity: 0.8,
            weight: 2,
          },
        });
        layer.setZIndex(ADM_LEVEL_INDEX_BY_CODE.get(item.admLevelCode)!);
        return [
          item.admLevelCode,
          layer,
        ];
      }),
    );
    const admGeojsonOverlays = Object.fromEntries(
      ADM_LEVEL_CODES_INDEXED.map((code) => {
        const label = getAdmGeojsonLayerLabel(code);
        const admLayer = admGeojsonLayersByCodeRef.current?.get(code);
        if (!admLayer) {
          const emptyLayer = L.geoJSON();
          emptyGeojsonLayersByCodeRef.current?.set(code, emptyLayer);
          return [label, emptyLayer];
        }
        return [label, admLayer];
      }),
    );
    const layerControl = L.control.layers(
      baseLayers,
      admGeojsonOverlays,
      {
        position: "bottomleft",
      },
    );
    layerControl.addTo(mapRef.current);
    mapLayerControlsRef.current = layerControl;

    const zoomControl = L.control.zoom({
      position: "bottomright",
    });
    zoomControl.addTo(mapRef.current);

    const cartoDbPane = mapRef.current.createPane(CARTO_DB_PANE.NAME);
    cartoDbPane.style.zIndex = `${CARTO_DB_PANE.ZINDEX}`;

    const admGeojsonPane = mapRef.current.createPane(
      ADM_GEOJSON_OVERLAY_PANE.NAME,
    );
    admGeojsonPane.style.zIndex = `${ADM_GEOJSON_OVERLAY_PANE.ZINDEX}`;

    const cartoDbLayer = L.tileLayer(
      CARTO_DB_TILE_LAYER_DATA.URL_TEMPLATE,
      {
        maxZoom: MAX_ZOOM,
        attribution: CARTO_DB_TILE_LAYER_DATA.ATTRIBUTION,
        pane: CARTO_DB_PANE.NAME,
      },
    );

    mapRef.current.on("baselayerchange", (e) => {
      if (e.name === satelliteTileLayerLabel) {
        cartoDbLayer.addTo(mapRef.current!);
      } else {
        cartoDbLayer.remove();
      }
    });

    mapRef.current.on("overlayadd", (e) => {
      let code!: AdmLevelCode;
      for (const levelCode of ADM_LEVEL_CODES_INDEXED) {
        const label = getAdmGeojsonLayerLabel(levelCode);
        if (label === e.name) {
          code = levelCode;
          break;
        }
      }
      const existingLayer = admGeojsonLayersByCodeRef.current?.get(code);
      if (!existingLayer) {
        mapRef.current!.removeLayer(e.layer);
        mapLayerControlsRef.current?.removeLayer(e.layer);
        emptyGeojsonLayersByCodeRef.current?.delete(code);
        syncAdmGeojsonDataForCode(code);
      }
    });
  }

  return <div ref={mapEl} class="w-full h-full"></div>;
}
