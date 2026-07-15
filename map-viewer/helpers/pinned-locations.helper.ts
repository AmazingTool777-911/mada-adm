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

export interface ShowPinnedLocationEvent extends Event {
  readonly detail: { locationEntryId: number };
}

export class ShowPinnedLocationOnMapEventHub {
  private target = new EventTarget();

  subscribe(listener: (event: ShowPinnedLocationEvent) => void) {
    this.target.addEventListener(
      "show-pinned-location",
      listener as EventListener,
    );
  }

  unsubscribe(listener: (event: ShowPinnedLocationEvent) => void) {
    this.target.removeEventListener(
      "show-pinned-location",
      listener as EventListener,
    );
  }

  dispatch(locationEntryId: number) {
    this.target.dispatchEvent(
      new CustomEvent("show-pinned-location", {
        detail: { locationEntryId },
      }),
    );
  }
}

export const showPinnedLocationOnMapEventHub =
  new ShowPinnedLocationOnMapEventHub();
