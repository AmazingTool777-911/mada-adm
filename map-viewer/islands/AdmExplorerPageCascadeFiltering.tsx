import { useSignal } from "@preact/signals";
import { Province, Region } from "@scope/types/models";
import AdmExplorerPageCascadeFilteringProvince from "@/islands/AdmExplorerPageCascadeFilteringProvince.tsx";
import AdmExplorerPageCascadeFilteringRegion from "@/islands/AdmExplorerPageCascadeFilteringRegion.tsx";

export default function AdmExplorerPageCascadeFiltering() {
  const selectedProvince = useSignal<Province | null>(null);
  const selectedRegion = useSignal<Region | null>(null);

  return (
    <form class="space-y-3 pb-4">
      <AdmExplorerPageCascadeFilteringProvince
        selectedProvince={selectedProvince.value}
        onSelectedChange={(province) => selectedProvince.value = province}
      />
      <AdmExplorerPageCascadeFilteringRegion
        selectedProvince={selectedProvince.value}
        selectedRegion={selectedRegion.value}
        onSelectedChange={(region) => selectedRegion.value = region}
      />
    </form>
  );
}
