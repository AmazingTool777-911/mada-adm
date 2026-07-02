import { useSignal } from "@preact/signals";
import { Province } from "@scope/types/models";
import AdmExplorerPageCascadeFilteringProvince from "@/islands/AdmExplorerPageCascadeFilteringProvince.tsx";

export default function AdmExplorerPageCascadeFiltering() {
  const selectedProvince = useSignal<Province | null>(null);

  return (
    <div>
      <AdmExplorerPageCascadeFilteringProvince
        selectedProvince={selectedProvince.value}
        onSelectedChange={(province) => selectedProvince.value = province}
      />
    </div>
  );
}
