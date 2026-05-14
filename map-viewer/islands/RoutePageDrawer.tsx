import { ComponentChildren } from "preact";
import { computed } from "@preact/signals";
import { PanelRightClose, PanelRightOpen } from "lucide-preact";
import { pageDrawerIsOpen } from "@/stores/layout.store.ts";

export type RoutePageDrawerProps = {
  children: ComponentChildren;
};

export default function RoutePageDrawer({ children }: RoutePageDrawerProps) {
  const toggleLabel = computed(() => {
    return pageDrawerIsOpen.value ? "Collapse the content" : "Expand the panel";
  });

  return (
    <div
      class={`h-dvh bg-white fixed left-(--sidebar-width) lg:relative lg:left-0 ${
        pageDrawerIsOpen.value ? "w-(--drawer-width)" : "w-0"
      }`}
      style="--drawer-width: min(calc(100vw - var(--sidebar-width)), 20rem); transition: all 400ms; z-index: calc(var(--base-z-index) + 30);"
    >
      <div
        class="absolute w-[min(calc(100vw-var(--sidebar-width)),20rem)] h-full top-0 right-0 py-4 bg-white"
        style={{
          boxShadow: `2px 0 2px rgba(0, 0, 0, 0.125)`,
          zIndex: `calc(var(--base-z-index) + 30)`,
        }}
      >
        <div
          class={`md:absolute top-0 md:top-4 right-0 md:mr-0 md:translate-x-[calc(100%+0.75rem)] bg-white ${
            pageDrawerIsOpen.value
              ? "relative ml-4 mr-2 mb-2 translate-x-0 float-right"
              : "absolute translate-x-[calc(100%+0.75rem)] top-4 mr-0"
          }`}
          style="z-index: calc(var(--base-z-index) + 30);"
        >
          <div
            className={`tooltip ${
              !pageDrawerIsOpen.value ? "tooltip-right" : "tooltip-left"
            }`}
            data-tip={toggleLabel}
          >
            <button
              type="button"
              aria-label={toggleLabel}
              class="btn btn-square btn-lg shadow"
              onClick={() => (pageDrawerIsOpen.value = !pageDrawerIsOpen
                .value)}
            >
              {!pageDrawerIsOpen.value
                ? <PanelRightClose />
                : <PanelRightOpen />}
            </button>
          </div>
        </div>
        <div
          className="duration-300"
          style={{ opacity: pageDrawerIsOpen.value ? "1" : "0" }}
        >
          {children}
        </div>
      </div>
      {pageDrawerIsOpen.value && (
        <div
          class="fixed h-dvh w-screen top-0 left-0 bg-black opacity-50 cursor-pointer md:invisible"
          style={{ zIndex: `calc(var(--base-z-index) + 20)` }}
          onClick={() => pageDrawerIsOpen.value = false}
        >
        </div>
      )}
    </div>
  );
}
