import PinsPageCtaBtn from "@/islands/PinsPageCtaBtn.tsx";
import PinsPagePinLocationModal from "@/islands/PinsPagePinLocationModal.tsx";

export default function PinsPage() {
  return (
    <div>
      <main>
        <header>
          <h1 class="font-bold text-lg mb-2">Pinned locations</h1>
          <p class="text-sm text-base-content/90">
            Save, organize, and monitor custom geographical markers directly on
            the map. You can capture your <strong>live coordinates</strong>{" "}
            with a real-time tracking <strong>beacon</strong>, or drop{" "}
            <strong>custom markers</strong>{" "}
            anywhere to dynamically resolve and explore their full
            administrative hierarchy from province down to fokontany.
          </p>
          <div class="mt-5">
            <PinsPageCtaBtn />
          </div>
        </header>
        <aside>
          <PinsPagePinLocationModal />
        </aside>
      </main>
    </div>
  );
}
