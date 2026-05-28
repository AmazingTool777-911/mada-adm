export const INITIAL_MAP_CENTER = [47.55295, -18.9189] as [number, number]; // Antananarivo
export const INITIAL_ZOOM = 5;
export const MAX_ZOOM = 19;

export const OFM_TILE_LAYER_STYLE_URL =
  "https://tiles.openfreemap.org/styles/liberty";

export type TileLayerData = Record<
  "LABEL" | "SOURCE" | "LAYER_ID" | "URL_TEMPLATE" | "ATTRIBUTION",
  string
>;

export const TILE_SIZE = 256;

export const ESRI_TILE_LAYER_DATA: TileLayerData = {
  LABEL: "Esri",
  SOURCE: "esri-satellite",
  LAYER_ID: "esri-sat",
  URL_TEMPLATE:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  // ATTRIBUTION: `© <a href="https://www.esri.com">Esri</a> - Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community`,
  ATTRIBUTION: `© <a href="https://www.esri.com">Esri</a>`,
};

export const CARTO_DB_TILE_LAYER_DATA: TileLayerData = {
  LABEL: "CartoDB",
  SOURCE: "carto-labels",
  LAYER_ID: "carto-lbl",
  URL_TEMPLATE:
    "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
  ATTRIBUTION:
    `© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, © <a href="https://carto.com">CartoDB</a>`,
};

export type PaneDefinition = {
  NAME: string;
  ZINDEX: number;
};

export const CARTO_DB_PANE: PaneDefinition = {
  NAME: "cartodb-labels",
  ZINDEX: 201,
};

export const ADM_GEOJSON_OVERLAY_PANE: PaneDefinition = {
  NAME: "adm-geojson-overlay",
  ZINDEX: 250,
};
