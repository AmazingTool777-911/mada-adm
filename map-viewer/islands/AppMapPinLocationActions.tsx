import AppMapTrackCurrentLocationFAB from "@/islands/AppMapTrackCurrentLocationFAB.tsx";
import AppMapPointOnMapFAB from "@/islands/AppMapPointOnMapFAB.tsx";
import AppMapManualCoordinatesEntryFAB from "@/islands/AppMapManualCoordinatesEntryFAB.tsx";
import { useStoresContext } from "@/islands/contexts/stores/index.ts";

export default function AppMapPinLocationActions() {
  const appMapStore = useStoresContext().injectAppMapStore();
  const { mapIsLoaded } = appMapStore;

  return mapIsLoaded.value && (
    <aside
      id="app-map-pin-location-actions"
      class="fixed top-4 right-2 flex flex-col gap-y-2.5"
      style="z-index: calc(var(--base-z-index) + 10)"
    >
      <AppMapTrackCurrentLocationFAB />
      <AppMapPointOnMapFAB />
      <AppMapManualCoordinatesEntryFAB />
    </aside>
  );
}
