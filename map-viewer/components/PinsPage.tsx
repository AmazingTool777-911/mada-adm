import PinsPageCtaBtn from "@/islands/PinsPageCtaBtn.tsx";
import PinsPagePinLocationModal from "@/islands/PinsPagePinLocationModal.tsx";
import PinsPageSavedLocations from "@/islands/PinsPageSavedLocations.tsx";

export default function PinsPage() {
  return (
    <div>
      <main>
        <header>
          <h1 class="font-bold text-lg mb-2">Pinned locations</h1>
          <p class="text-sm text-base-content/90">
            Save, organize, and monitor custom geographical markers directly on
            the map. You can capture your <strong>live coordinates</strong>{" "}
            with a real-time tracking <strong>beacon</strong>, drop{" "}
            <strong>custom markers</strong> anywhere, or manually enter{" "}
            <strong>geographic coordinates</strong>{" "}
            to dynamically resolve and explore their{" "}
            <strong>full administrative hierarchy</strong>{" "}
            from province down to fokontany.
          </p>
          <div class="mt-5">
            <PinsPageCtaBtn />
          </div>
        </header>
        <div class="mt-6">
          <PinsPageSavedLocations />
        </div>
        <aside>
          <PinsPagePinLocationModal />
        </aside>
      </main>
    </div>
  );
}
