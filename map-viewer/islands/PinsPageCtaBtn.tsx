import { PinIcon } from "lucide-preact";
import { injectPinnedLocationsStore } from "@/stores/pinned-locations.store.ts";
import { injectFokontanyApi } from "@/api/fokontany.api.ts";
import { injectApiStore } from "@/stores/api.store.ts";

export default function PinsPageCtaBtn() {
  const fokontanyApi = injectFokontanyApi();
  const apiStore = injectApiStore();
  const { showPanel } = injectPinnedLocationsStore(fokontanyApi, apiStore);

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
