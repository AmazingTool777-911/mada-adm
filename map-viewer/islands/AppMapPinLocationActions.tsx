import AppMapTrackCurrentLocationFAB from "@/islands/AppMapTrackCurrentLocationFAB.tsx";
import AppMapPointOnMapFAB from "@/islands/AppMapPointOnMapFAB.tsx";
import AppMapManualCoordinatesEntryFAB from "@/islands/AppMapManualCoordinatesEntryFAB.tsx";

export default function AppMapPinLocationActions() {
  return (
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
