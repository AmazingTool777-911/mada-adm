import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "preact/hooks";
import {
  CARTO_DB_TILE_LAYER_DATA,
  ESRI_TILE_LAYER_DATA,
  INITIAL_MAP_CENTER,
  INITIAL_ZOOM,
  MAX_ZOOM,
  OFM_TILE_LAYER_STYLE_URL,
  TILE_SIZE,
} from "@/consts/map.consts.ts";

export type AppMapProps = {
  a?: string;
};

export default function AppMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const map = new maplibregl.Map({
      style: OFM_TILE_LAYER_STYLE_URL,
      center: INITIAL_MAP_CENTER,
      zoom: INITIAL_ZOOM,
      maxZoom: MAX_ZOOM,
      container: mapContainerRef.current!,
    });

    const layerSwitcher = new LayerSwitcherControl(map);
    map.addControl(new LayerSwitcherControl(map), "bottom-left");

    return () => {
      layerSwitcher.onRemove();
      map.remove();
    };
  }, []);

  return <div ref={mapContainerRef} class="h-full w-full"></div>;
}

class LayerSwitcherControl implements maplibregl.IControl {
  private container!: HTMLElement;
  private map: maplibregl.Map;
  private panel!: HTMLElement;
  private satelliteLoaded = false;

  constructor(map: maplibregl.Map) {
    this.map = map;
  }

  onAdd(map: maplibregl.Map) {
    this.map = map;

    this.container = document.createElement("div");
    this.container.className =
      "maplibregl-ctrl maplibregl-ctrl-group layer-switcher";
    this.container.style.marginLeft = "12px";
    this.container.innerHTML = `
      <!--<div class="ls-panel" hidden>
        <p class="ls-section-label">Base layer</p>
        <label class="ls-option">
          <input type="radio" name="baselayer" value="vector" checked />
          Vector
        </label>
        <label class="ls-option">
          <input type="radio" name="baselayer" value="satellite" />
          Satellite
        </label>
      </div>
      <button class="ls-btn" aria-label="Toggle layer switcher" aria-expanded="false">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2l9 4.5-9 4.5-9-4.5z"/>
          <path d="M3 11.5l9 4.5 9-4.5"/>
          <path d="M3 16.5l9 4.5 9-4.5"/>
        </svg>
      </button>-->
      <div>
        <div class="tooltip tooltip-right" data-tip="Map layers">
          <div>
            <div class="dropdown dropdown-top dropdown-start">
              <div tabindex="0" role="button" class="btn btn-square m-1 text-base-content/80 hover:text-base-content duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers-icon lucide-layers"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg>
              </div>
              <div tabindex="-1" class="dropdown-content bg-base-100 rounded-box z-1 w-52 shadow-sm">
                <ul class="menu menu-sm w-full">
                  <li class="menu-title text-xs">View</li>
                  <li>
                    <label for="map-base-tile-vector">
                      <input type="radio" name="map-base-tile" value="vector" id="map-base-tile-vector" class="radio radio-xs radio-primary" checked="checked" />
                      Vector
                    </label>
                  </li>
                  <li>
                    <label for="map-base-tile-satellite">
                      <input type="radio" name="map-base-tile" value="satellite" id="map-base-tile-satellite" class="radio radio-xs radio-primary" />
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

    this.panel = this.container.querySelector<HTMLElement>(".ls-panel")!;

    // Radio change
    this.container.querySelectorAll<HTMLInputElement>(
      'input[name="map-base-tile"]',
    ).forEach((radio) => {
      radio.addEventListener("change", () => {
        this.setMode(radio.value as "vector" | "satellite");
      });
    });

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
        // this.map.getStyle().layers[0].id, // insert below all Liberty layers
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
  }
}
