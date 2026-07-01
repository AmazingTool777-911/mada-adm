import { useSignal } from "@preact/signals";
import { ArrowDownFromLine, ArrowDownWideNarrow } from "lucide-preact";
import AdmExplorerPageGlobalFiltering from "@/islands/AdmExplorerPageGlobalFiltering.tsx";

export default function AdmExplorerPageSearchModeTabs() {
  const activeTab = useSignal<"global" | "cascade">("global");

  const activeClassName = "text-primary [--tab-border-color:primary]";

  return (
    <>
      <div
        role="tablist"
        class="tabs tabs-border border-b border-b-solid border-b-base-content/30 sticky top-0 pt-1 bg-white z-10"
      >
        <label
          class={`tab ${activeTab.value === "global" ? activeClassName : ""}`}
        >
          <input
            type="radio"
            name="search-mode"
            checked={activeTab.value === "global"}
            onChange={() => activeTab.value = "global"}
          />
          <ArrowDownFromLine size={16} class="mr-2" />
          Global mode
        </label>
        <label
          class={`tab ${activeTab.value === "cascade" ? activeClassName : ""}`}
        >
          <input
            type="radio"
            name="search-mode"
            checked={activeTab.value === "cascade"}
            onChange={() => activeTab.value = "cascade"}
          />
          <ArrowDownWideNarrow
            size={16}
            class="mr-2"
          />
          Cascade mode
        </label>
      </div>
      <div class="pt-5 h-dvh">
        {activeTab.value === "global" && <AdmExplorerPageGlobalFiltering />}
      </div>
    </>
  );
}
