import { PinIcon } from "lucide-preact";
import { injectPinLocationPanelStore } from "@/stores/pin-location-panel.store.ts";

export default function PinsPageCtaBtn() {
  const { showPanel } = injectPinLocationPanelStore();

  return (
    <>
      <button
        type="button"
        class="btn btn-primary flex items-center"
        onClick={() => showPanel.value = true}
      >
        <PinIcon size={16} />
        <span>Pin a location to the map</span>
      </button>
    </>
  );
}
