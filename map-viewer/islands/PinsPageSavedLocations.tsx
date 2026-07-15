import PinsPageCurrentLocationCard from "@/islands/PinsPageCurrentLocationCard.tsx";
import { injectFokontanyApi } from "@/api/fokontany.api.ts";
import { injectApiStore } from "@/stores/api.store.ts";
import { injectPinnedLocationsStore } from "@/stores/pinned-locations.store.ts";

export default function PinsPageSavedLocations() {
  const fokontanyApi = injectFokontanyApi();
  const apiStore = injectApiStore();
  const pinnedLocationsStore = injectPinnedLocationsStore(
    fokontanyApi,
    apiStore,
  );

  const hasSavedLocations = !!pinnedLocationsStore.currentLocationEntry.value;

  return (
    <section aria-labelledby="pins-page-saved-locations-title">
      <h2 id="pins-page-saved-locations-title" class="font-bold">
        Saved locations
      </h2>
      {!hasSavedLocations && (
        <p class="text-sm text-base-content/70 mt-1.5">
          No saved locations yet.
        </p>
      )}
      {pinnedLocationsStore.currentLocationEntry.value && (
        <div class="mt-3">
          <PinsPageCurrentLocationCard />
        </div>
      )}
    </section>
  );
}
