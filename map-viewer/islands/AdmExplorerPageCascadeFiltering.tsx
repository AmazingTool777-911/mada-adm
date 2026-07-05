import { useSignal } from "@preact/signals";
import { Commune, District, Province, Region } from "@scope/types/models";
import AdmExplorerPageCascadeFilteringProvince from "@/islands/AdmExplorerPageCascadeFilteringProvince.tsx";
import AdmExplorerPageCascadeFilteringRegion from "@/islands/AdmExplorerPageCascadeFilteringRegion.tsx";
import AdmExplorerPageCascadeFilteringDistrict from "@/islands/AdmExplorerPageCascadeFilteringDistrict.tsx";
import AdmExplorerPageCascadeFilteringCommune from "@/islands/AdmExplorerPageCascadeFilteringCommune.tsx";

export default function AdmExplorerPageCascadeFiltering() {
  const selectedProvince = useSignal<Province | null>(null);
  const selectedRegion = useSignal<Region | null>(null);
  const selectedDistrict = useSignal<District | null>(null);
  const selectedCommune = useSignal<Commune | null>(null);

  return (
    <form class="space-y-3 pb-60">
      <AdmExplorerPageCascadeFilteringProvince
        selectedProvince={selectedProvince.value}
        onSelectedChange={(province) => selectedProvince.value = province}
      />
      <AdmExplorerPageCascadeFilteringRegion
        selectedProvince={selectedProvince.value}
        selectedRegion={selectedRegion.value}
        onSelectedChange={(region) => selectedRegion.value = region}
      />
      <AdmExplorerPageCascadeFilteringDistrict
        selectedProvince={selectedProvince.value}
        selectedRegion={selectedRegion.value}
        selectedDistrict={selectedDistrict.value}
        onSelectedChange={(district) => selectedDistrict.value = district}
      />
      <AdmExplorerPageCascadeFilteringCommune
        selectedProvince={selectedProvince.value}
        selectedRegion={selectedRegion.value}
        selectedDistrict={selectedDistrict.value}
        selectedCommune={selectedCommune.value}
        onSelectedChange={(commune) => selectedCommune.value = commune}
      />
    </form>
  );
}
