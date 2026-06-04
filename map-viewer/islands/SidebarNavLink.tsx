import { ComponentChildren, FunctionComponent } from "preact";
import { LucideProps } from "lucide-preact";
import { useEffect, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { injectAppLayoutStore } from "@/stores/app-layout.store.ts";

export type SidebarNavLinkProps = {
  href: string;
  fPartial: string;
  Icon: FunctionComponent<LucideProps>;
  children: ComponentChildren;
  isActive?: boolean;
  tooltip: string;
};

export default function SidebarNavLink({
  href,
  fPartial,
  Icon,
  children,
  isActive = false,
  tooltip,
}: SidebarNavLinkProps) {
  const appLayoutStore = injectAppLayoutStore();

  const aElRef = useRef<HTMLAnchorElement>(null);

  const hasLeftNavigation = useSignal(false);

  useEffect(() => {
    if (
      isActive && !appLayoutStore.firstNavLinkIsLoaded.value && aElRef.current
    ) {
      aElRef.current.setAttribute("aria-current", "page");

      appLayoutStore.firstNavLinkIsLoaded.value = true;

      navigation.addEventListener("navigate", (e) => {
        if (!hasLeftNavigation.value) {
          const url = new URL(e.destination.url);
          if (!url.pathname.startsWith(href)) {
            hasLeftNavigation.value = true;
            aElRef.current?.removeAttribute("aria-current");
          }
        }
      });
    }
  }, []);

  return (
    <div className="tooltip tooltip-right" data-tip={tooltip}>
      <a
        ref={aElRef}
        f-partial={fPartial}
        href={href}
        class={`relative flex flex-col items-center gap-1 text-center border-l-4 pr-2 pl-1 py-3 border-transparent aria-[current=page]:border-primary aria-[current=page]:text-primary hover:bg-slate-300 text-base-content/90 hover:text-base-content duration-300`}
        onClick={() => appLayoutStore.toggleSidebar(true)}
      >
        <Icon size={32} />
        <div class="uppercase" style="font-size: 0.625rem">{children}</div>
      </a>
    </div>
  );
}
