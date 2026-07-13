import { PinIcon } from "lucide-preact";
import { injectPinnedLocationsStore } from "@/stores/pinned-locations.store.ts";
import { injectFokontanyApi } from "@/api/fokontany.api.ts";

export default function PinsPageCtaBtn() {
  const fokontanyApi = injectFokontanyApi();
  const { showPanel } = injectPinnedLocationsStore(fokontanyApi);

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
