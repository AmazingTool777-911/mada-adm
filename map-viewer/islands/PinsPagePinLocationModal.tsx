import { useEffect, useRef } from "preact/hooks";
import { useSignal, useSignalEffect } from "@preact/signals";
import { MapPinPlusIcon, PinIcon } from "lucide-preact";
import { injectPinLocationPanelStore } from "@/stores/pin-location-panel.store.ts";
import LocationTargetIcon from "@/islands/icons/LocationTargetIcon.tsx";
import CompassIcon from "@/islands/icons/CompassIcon.tsx";
import PinsPagePinLocationModalPinTypeOption from "@/islands/PinsPagePinLocationModalPinTypeOption.tsx";

export default function PinsPagePinLocationModal() {
  const { showPanel } = injectPinLocationPanelStore();

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
    });
  }, []);

  const selectedPinType = useSignal<"live" | "marker" | "coordinates" | null>(
    null,
  );

  return (
    <dialog
      ref={dialogEltRef}
      class="modal"
    >
      <div class="modal-box w-11/12 max-w-2xl">
        <h3 class="text-lg font-bold flex items-center gap-x-3 mb-4">
          <PinIcon /> <span>Pin a location to the map</span>
        </h3>
        <div class="space-y-4">
          <PinsPagePinLocationModalPinTypeOption
            pinType="live"
            title="Current Location Tracker"
            description="Place a marker tied directly to your device's physical location."
            icon={<LocationTargetIcon size={22} color="currentColor" />}
            selectedPinType={selectedPinType.value}
            onSelectedPinChange={(v) => selectedPinType.value = v}
          />
          <PinsPagePinLocationModalPinTypeOption
            pinType="marker"
            title="Custom Map Pin"
            description="Interactively choose a spot on the map interface. Drops a static marker with fixed coordinates once placed."
            icon={<MapPinPlusIcon size={24} stroke-width={2.5} />}
            selectedPinType={selectedPinType.value}
            onSelectedPinChange={(v) => selectedPinType.value = v}
          />
          <PinsPagePinLocationModalPinTypeOption
            pinType="coordinates"
            title="Manual Coordinate Entry"
            description="Specify exact geographical metrics to place a precise static marker on the map grid."
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
