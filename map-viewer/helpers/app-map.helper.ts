import maplibregl, { type LngLatBoundsLike, type Map } from "maplibre-gl";
import { GeoJSONFeatureCollection, GeoJSONGeometry } from "@scope/types/utils";
import type {
  GeometryCalculationWorkerMessageData,
  GeometryCalculationWorkerResponseData,
} from "@/islands/workers/geometry-bbox-calculator.worker.ts";
import { AdmLevelCode } from "@scope/consts/models";

type MapClickEvent =
  & maplibregl.MapMouseEvent
  & {
    features?: maplibregl.MapGeoJSONFeature[];
  }
  // deno-lint-ignore ban-types
  & Object;

export type AddGeoJsonLayerToMapOptions = {
  source: string;
  sentinelLayerId: string;
  color: string;
  layerId: string;
  outlineLayerId: string;
  renderPopupHTML: (features?: maplibregl.MapGeoJSONFeature[]) => string;
  onPopup?: (popup: maplibregl.Popup) => void;
  onPopupRemoved?: (popup: maplibregl.Popup) => void;
};

export function addGeoJsonLayerToMap(
  map: maplibregl.Map,
  geojson: GeoJSONFeatureCollection<Record<string, unknown>> | GeoJSONGeometry,
  options: AddGeoJsonLayerToMapOptions,
): () => void {
  const {
    source,
    sentinelLayerId,
    color,
    layerId,
    outlineLayerId,
    renderPopupHTML,
    onPopup,
    onPopupRemoved,
  } = options;
  map.addSource(source, {
    type: "geojson",
    data: geojson,
    generateId: true,
  });

  map.addLayer({
    id: layerId,
    type: "fill",
    source,
    paint: {
      "fill-color": color,
      "fill-opacity": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        0.4,
        0.2,
      ],
    },
  }, sentinelLayerId);

  let hoveredId: number | null = null;
  let isGrabbing = false;
  map.on("mousedown", () => {
    isGrabbing = true;
    map.getCanvas().style.cursor = "grabbing";
  });
  map.on("mouseup", () => {
    isGrabbing = false;
    map.getCanvas().style.cursor = hoveredId ? "pointer" : "grab";
  });
  map.on("mousemove", layerId, (e) => {
    if (e.features!.length > 0) {
      if (hoveredId !== null) {
        map.setFeatureState({ source, id: hoveredId }, {
          hover: false,
        });
      }
      hoveredId = e.features![0].id as number;
      map.setFeatureState({ source, id: hoveredId }, {
        hover: true,
      });
    }
  });
  map.on("mouseenter", layerId, () => {
    if (isGrabbing) return;
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", layerId, () => {
    if (hoveredId !== null) {
      map.setFeatureState({ source, id: hoveredId }, {
        hover: false,
      });
    }
    hoveredId = null;
    if (isGrabbing) return;
    map.getCanvas().style.cursor = "grab";
  });

  let activePopup: maplibregl.Popup | null = null;
  function handleMapClick(event: MapClickEvent) {
    if (event.originalEvent.defaultPrevented) return;
    const features = map.queryRenderedFeatures(event.point);
    if (features.length > 0 && features[0].layer.id !== layerId) return;
    event.originalEvent.preventDefault();
    if (activePopup) {
      activePopup.remove();
    }
    const popupHTML = renderPopupHTML(event.features);
    activePopup = new maplibregl.Popup({ maxWidth: "none" })
      .setLngLat(event.lngLat)
      .setHTML(popupHTML)
      .addTo(map);
    onPopup?.(activePopup);
    activePopup.on("close", () => {
      activePopup && onPopupRemoved?.(activePopup);
    });
  }
  map.on("click", layerId, handleMapClick);

  map.addLayer({
    id: outlineLayerId,
    type: "line",
    source,
    paint: {
      "line-color": color,
      "line-width": 2,
    },
  }, layerId);

  return () => {
    map.off("click", layerId, handleMapClick);
    activePopup?.remove();
  };
}

export async function calculateGeoJsonBbox(
  geojson: GeoJSONFeatureCollection<Record<string, unknown>> | GeoJSONGeometry,
): Promise<LngLatBoundsLike> {
  const worker = new Worker(
    new URL(
      "../islands/workers/geometry-bbox-calculator.worker.ts",
      import.meta.url,
    ),
    { type: "module" },
  );
  const id = Date.now().toString();
  const data: GeometryCalculationWorkerMessageData = {
    id,
    geojson,
  };
  worker.postMessage(data);
  const bbox = await new Promise<
    GeometryCalculationWorkerResponseData["bbox"]
  >((resolve, reject) => {
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error("Geometry calculation timeout"));
    }, 20_000);
    worker.onmessage = (e) => {
      const response = e.data as GeometryCalculationWorkerResponseData;
      if (response.id === data.id) {
        clearTimeout(timeout);
        resolve(response.bbox);
      }
    };
  });
  return bbox as maplibregl.LngLatBoundsLike;
}

export async function fitGeoJsonBboxIntoMap(
  map: Map,
  geojson: GeoJSONFeatureCollection<Record<string, unknown>> | GeoJSONGeometry,
): Promise<void> {
  const bbox = await calculateGeoJsonBbox(geojson);
  map.fitBounds(bbox as maplibregl.LngLatBoundsLike, {
    padding: 25,
    duration: 1000,
  });
}

export function getDynamicAdmGeoJsonSource(
  admLevelCode: AdmLevelCode,
  name: string,
): string {
  return `dynamic-adm-geojson-source-${admLevelCode}-${name}`;
}

export function getDynamicAdmGeoJsonLayerId(
  admLevelCode: AdmLevelCode,
  name: string,
): string {
  return `dynamic-adm-geojson-layer-${admLevelCode}-${name}`;
}

export function getDynamicAdmGeoJsonOutlineLayerId(
  admLevelCode: AdmLevelCode,
  name: string,
): string {
  return `dynamic-adm-geojson-outline-layer-${admLevelCode}-${name}`;
}
