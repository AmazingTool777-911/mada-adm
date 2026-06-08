import { ArrowDownFromLine, ArrowDownWideNarrow } from "lucide-preact";
import { useSignal } from "@preact/signals";
import AdmExplorerPageGlobalFiltering from "@/islands/AdmExplorerPageGlobalFiltering.tsx";

export default function AdmExplorerPageSearchModeTabs() {
  const activeTab = useSignal<"global" | "cascade">("global");

  const activeClassName =
    "tab-active text-primary [--tab-border-color:primary]";

  return (
    <>
      <div
        role="tablist"
        class="tabs tabs-border border-b border-b-solid border-b-base-content/30 sticky top-0 pt-1 bg-white"
      >
        <a
          role="tab"
          class={`tab ${activeTab.value === "global" ? activeClassName : ""}`}
          onClick={() => activeTab.value = "global"}
        >
          <ArrowDownFromLine size={16} class="mr-2" />
          Global mode
        </a>
        <a
          role="tab"
          class={`tab ${activeTab.value === "cascade" ? activeClassName : ""}`}
          onClick={() => activeTab.value = "cascade"}
        >
          <ArrowDownWideNarrow
            size={16}
          />
          Cascade mode
        </a>
      </div>
      <div class="pt-5 h-dvh">
        <AdmExplorerPageGlobalFiltering />
      </div>
    </>
  );
}
