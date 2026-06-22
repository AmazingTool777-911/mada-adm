import type { LngLatBoundsLike, Map } from "maplibre-gl";
import { GeoJSONFeatureCollection } from "@scope/types/utils";
import type {
  GeometryCalculationWorkerMessageData,
  GeometryCalculationWorkerResponseData,
} from "@/islands/workers/geometry-bbox-calculator.worker.ts";

export async function calculateGeoJsonBbox(
  geojson: GeoJSONFeatureCollection<Record<string, unknown>>,
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
    }, 10000);
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
  geojson: GeoJSONFeatureCollection<Record<string, unknown>>,
): Promise<void> {
  const bbox = await calculateGeoJsonBbox(geojson);
  map.fitBounds(bbox as maplibregl.LngLatBoundsLike, {
    padding: 25,
    duration: 1000,
  });
}
