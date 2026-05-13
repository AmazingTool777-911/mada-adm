export const INITIAL_MAP_CENTER = [-18.9189, 47.55295] as L.LatLngTuple; // Antananarivo
export const INITIAL_ZOOM = 5;
export const MAX_ZOOM = 19;

export type TileLayerData = Record<
  "LABEL" | "URL_TEMPLATE" | "ATTRIBUTION",
  string
>;

export const OSM_TILE_LAYER_DATA: TileLayerData = {
  LABEL: "OpenStreetMap",
  URL_TEMPLATE: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  ATTRIBUTION:
    `© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>`,
};

export const ESRI_TILE_LAYER_DATA: TileLayerData = {
  LABEL: "Esri",
  URL_TEMPLATE:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  ATTRIBUTION:
    `© <a href="https://www.esri.com">Esri</a> - Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community`,
};

export const CARTO_DB_TILE_LAYER_DATA: TileLayerData = {
  LABEL: "CartoDB",
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
