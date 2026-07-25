import { useEffect, useRef } from "preact/hooks";
import { useSignal, useSignalEffect } from "@preact/signals";
import { MapPinPlusIcon, PinIcon } from "lucide-preact";
import { injectPinnedLocationsStore } from "@/stores/pinned-locations.store.ts";
import LocationTargetIcon from "@/islands/icons/LocationTargetIcon.tsx";
import CompassIcon from "@/islands/icons/CompassIcon.tsx";
import PinsPagePinLocationModalPinTypeOption from "@/islands/PinsPagePinLocationModalPinTypeOption.tsx";
import PinsPagePinLocationModalCurrentLocationTrackingForm from "@/islands/PinsPagePinLocationModalCurrentLocationTrackingForm.tsx";
import { injectFokontanyApi } from "@/api/fokontany.api.ts";
import { injectApiStore } from "@/stores/api.store.ts";
import PinsPagePinLocationModalPointOnMapForm from "@/islands/PinsPagePinLocationModalPointOnMapForm.tsx";

type SelectedPinType = "live" | "marker" | "coordinates";

export default function PinsPagePinLocationModal() {
  const fokontanyApi = injectFokontanyApi();
  const apiStore = injectApiStore();
  const { showPanel } = injectPinnedLocationsStore(fokontanyApi, apiStore);

  const selectedPinType = useSignal<SelectedPinType | null>(null);

  const dialogEltRef = useRef<HTMLDialogElement>(null);

  useSignalEffect(() => {
    const dialog = dialogEltRef.current;
    if (dialog) {
      if (showPanel.value) {
        !dialog.open && dialog.showModal();
      } else {
        dialog.open && dialog.close();
      }
    }
  });

  useEffect(() => {
    dialogEltRef.current?.addEventListener("close", () => {
      showPanel.value = false;
      selectedPinType.value = null;
    });
  }, []);

  return (
    <dialog
      ref={dialogEltRef}
      class="modal"
    >
      <div class="modal-box w-11/12 max-w-2xl">
        <h3 class="text-lg font-bold flex items-center gap-x-3 mb-4">
          <PinIcon /> <span>Pin a location to the map</span>
        </h3>
        <div class="space-y-5">
          <PinsPagePinLocationModalPinTypeOption
            pinType="live"
            title="Current Location Tracker"
            description="Track your device's physical location through a beacon on the map."
            icon={<LocationTargetIcon size={22} color="currentColor" />}
            selectedPinType={selectedPinType.value}
            onSelectedPinChange={(v) => selectedPinType.value = v}
          >
            <PinsPagePinLocationModalCurrentLocationTrackingForm />
          </PinsPagePinLocationModalPinTypeOption>
          <PinsPagePinLocationModalPinTypeOption
            pinType="marker"
            title="Point on Map"
            description="Drop a marker onto the map at the exact location of the pin."
            icon={<MapPinPlusIcon size={24} stroke-width={2.5} />}
            selectedPinType={selectedPinType.value}
            onSelectedPinChange={(v) => selectedPinType.value = v}
          >
            <PinsPagePinLocationModalPointOnMapForm />
          </PinsPagePinLocationModalPinTypeOption>
          <PinsPagePinLocationModalPinTypeOption
            pinType="coordinates"
            title="Manual Coordinates Entry"
            description="Enter any arbitrary geographic coordinates of the pin's location."
            icon={<CompassIcon size={22} color="currentColor" />}
            selectedPinType={selectedPinType.value}
            onSelectedPinChange={(v) => selectedPinType.value = v}
          />
        </div>
        <div class="modal-action">
          <button
            type="button"
            class="btn"
            onClick={() => showPanel.value = false}
          >
            Close
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
