import { GEOLOCATION_COORDINDATE_EPSILON } from "@/config/pinned-locations.config.ts";

export function compareGeographicCoordinates(
  coords1: [number, number],
  coords2: [number, number],
): boolean {
  const diff1 = Math.abs(coords1[0] - coords1[1]);
  const diff2 = Math.abs(coords2[0] - coords2[1]);
  return diff1 < GEOLOCATION_COORDINDATE_EPSILON &&
    diff2 < GEOLOCATION_COORDINDATE_EPSILON;
}
