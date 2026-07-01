/**
 * Represents a value that can be either synchronous or asynchronous.
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Represents a GeoJSON Geometry.
 */
export type GeoJSONGeometry =
  | {
    type: "Polygon";
    coordinates: number[][][];
  }
  | {
    type: "MultiPolygon";
    coordinates: number[][][][];
  };

/**
 * Represents an individual GeoJSON feature.
 */
export type GeoJSONFeature<T extends Record<string, unknown>> = {
  type: "Feature";
  geometry: GeoJSONGeometry;
  properties: T;
};

/**
 * Represents a GeoJSON Feature Collection.
 */
export type GeoJSONFeatureCollection<T extends Record<string, unknown>> = {
  type: "FeatureCollection";
  features: GeoJSONFeature<T>[];
};

/**
 * Replaces the keys of an object with a new type.
 */
export type ReplaceKeys<T, TNewType> = {
  [K in keyof T]: TNewType;
};

/**
 * Makes the K keys of T required.
 */
export type WithRequiredFields<T, K extends keyof T> =
  & Omit<T, K>
  & Required<Pick<T, K>>;
