import { computed, signal } from "@preact/signals";
import { DetailedError } from "@hono/hono/client";
import { Fokontany } from "@scope/types/models";
import {
  CURRENT_LOCATION_TRACKING_DURATION_BY_PROFILE,
  CurrentLocationTrackingProfile,
  PinnedLocationErrorCause,
} from "@/consts/pinned-locations.consts.ts";
import { GEOLOCATION_TIMEOUT } from "@/config/pinned-locations.config.ts";
import { FokontanyApi } from "@/api/fokontany.api.ts";
import { compareGeographicCoordinates } from "@/helpers/pinned-locations.helper.ts";
import { ApiStore } from "@/stores/api.store.ts";

export type PinnedLocationEntry = {
  id: number;
  title: string;
  updatedAt: Date;
  coordinates: {
    lat: number;
    lng: number;
  };
  isLocked: boolean;
  isLoadingFokontany: boolean;
  fokontanyErrorCause: PinnedLocationErrorCause | null;
  fokontany: Fokontany | null;
};

export class PinnedLocationsStore {
  constructor(private fokontanyApi: FokontanyApi, private apiStore: ApiStore) {}

  readonly showPanel = signal(false);

  readonly trackingProfileFrequency = signal<CurrentLocationTrackingProfile>(
    CurrentLocationTrackingProfile.Snapshot,
  );
  readonly highAccuracyGeolocationEnabled = signal(false);
  readonly geolocationIsLoading = signal(false);
  readonly geolocationError = signal<GeolocationPositionError | null>(null);
  readonly geolocationErrorMessage = computed<string | null>(() => {
    const error = this.geolocationError.value;
    if (!error) return null;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "User denied the request for Geolocation.";
      case error.POSITION_UNAVAILABLE:
        return "Current location information is unavailable.";
      case error.TIMEOUT:
        return "The request to get the current location timed out.";
      default:
        return "An unknown error occurred.";
    }
  });
  readonly currentLocationEntry = signal<PinnedLocationEntry | null>(
    null,
  );

  private currentLocationTrackingInterval:
    | ReturnType<typeof setInterval>
    | null = null;

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: this.highAccuracyGeolocationEnabled.value,
          timeout: GEOLOCATION_TIMEOUT,
          maximumAge: 0,
        },
      );
    });
  }

  private async loadCurrentLocationFokontany() {
    if (!this.currentLocationEntry.value) return;
    if (this.apiStore.configIsLoaded.value && !this.apiStore.config.value) {
      this.currentLocationEntry.value = {
        ...this.currentLocationEntry.value,
        fokontany: null,
        isLoadingFokontany: false,
        fokontanyErrorCause: PinnedLocationErrorCause.UnavailableConfig,
      };
      return;
    }
    try {
      const fokontany = await this.fokontanyApi
        .getByCoordinates(
          this.currentLocationEntry.value.coordinates.lat,
          this.currentLocationEntry.value.coordinates.lng,
        );
      if (this.currentLocationEntry.value) {
        this.currentLocationEntry.value = {
          ...this.currentLocationEntry.value,
          fokontany,
          isLoadingFokontany: false,
          fokontanyErrorCause: null,
        };
      }
    } catch (error) {
      console.error(error);
      if (this.currentLocationEntry.value) {
        this.currentLocationEntry.value = {
          ...this.currentLocationEntry.value,
          fokontany: null,
          isLoadingFokontany: false,
          fokontanyErrorCause:
            (error instanceof DetailedError && error.statusCode === 404)
              ? PinnedLocationErrorCause.NotFound
              : PinnedLocationErrorCause.Unexpected,
        };
      }
    }
  }

  async loadInitialCurrentLocation(): Promise<boolean> {
    if (this.currentLocationTrackingInterval) {
      clearInterval(this.currentLocationTrackingInterval);
      this.currentLocationTrackingInterval = null;
    }

    this.geolocationIsLoading.value = true;

    let isSuccess = true;

    try {
      const position = await this.getCurrentPosition();
      this.currentLocationEntry.value = {
        id: this.currentLocationEntry.value?.id ?? Date.now(),
        title: "Current location",
        updatedAt: new Date(),
        coordinates: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        isLocked: this.currentLocationEntry.value?.isLocked ?? true,
        isLoadingFokontany: true,
        fokontanyErrorCause:
          this.currentLocationEntry.value?.fokontanyErrorCause ?? null,
        fokontany: this.currentLocationEntry.value?.fokontany ?? null,
      };
      this.geolocationError.value = null;

      this.loadCurrentLocationFokontany();
    } catch (error) {
      console.error(error);
      this.geolocationError.value = error as GeolocationPositionError;
      isSuccess = false;
    } finally {
      this.geolocationIsLoading.value = false;
    }

    return isSuccess;
  }

  initCurrentLocationTracking() {
    if (
      this.trackingProfileFrequency.value !==
        CurrentLocationTrackingProfile.Snapshot
    ) {
      if (this.currentLocationTrackingInterval) {
        clearInterval(this.currentLocationTrackingInterval);
        this.currentLocationTrackingInterval = null;
      }

      const duration = CURRENT_LOCATION_TRACKING_DURATION_BY_PROFILE.get(
        this.trackingProfileFrequency.value,
      )!;
      this.currentLocationTrackingInterval = setInterval(async () => {
        try {
          const position = await this.getCurrentPosition();
          if (this.currentLocationEntry.value) {
            const prevCoords = this.currentLocationEntry.value?.coordinates;

            const isSamePosition = compareGeographicCoordinates(
              [position.coords.latitude, position.coords.longitude],
              [prevCoords.lat, prevCoords.lng],
            );

            this.currentLocationEntry.value = {
              ...this.currentLocationEntry.value,
              id: this.currentLocationEntry.value.id,
              updatedAt: new Date(),
              coordinates: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
              isLoadingFokontany: !isSamePosition,
            };
            this.geolocationError.value = null;

            if (!isSamePosition) {
              await this.loadCurrentLocationFokontany();
            }
          }
        } catch (error) {
          console.error(error);
          this.geolocationError.value = error as GeolocationPositionError;
        }
      }, duration);
    }
  }

  clearCurrentLocationTracking() {
    if (this.currentLocationTrackingInterval) {
      clearInterval(this.currentLocationTrackingInterval);
      this.currentLocationTrackingInterval = null;
    }
    this.currentLocationEntry.value = null;
    this.geolocationError.value = null;
    this.geolocationIsLoading.value = false;
    this.trackingProfileFrequency.value =
      CurrentLocationTrackingProfile.Snapshot;
    this.highAccuracyGeolocationEnabled.value = false;
  }
}

let _instance: PinnedLocationsStore | null = null;

export function injectPinnedLocationsStore(
  fokontanyApi: FokontanyApi,
  apiStore: ApiStore,
): PinnedLocationsStore {
  return _instance ??= new PinnedLocationsStore(fokontanyApi, apiStore);
}
