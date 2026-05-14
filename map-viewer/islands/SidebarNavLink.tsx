import { ComponentChildren, FunctionComponent } from "preact";
import { LucideProps } from "lucide-preact";
import { useEffect, useRef } from "preact/hooks";
import { pageDrawerIsOpen } from "@/stores/layout.store.ts";

export type SidebarNavLinkProps = {
  href: string;
  fPartial: string;
  Icon: FunctionComponent<LucideProps>;
  children: ComponentChildren;
  isActive?: boolean;
};

export default function SidebarNavLink({
  href,
  fPartial,
  Icon,
  children,
  isActive = false,
}: SidebarNavLinkProps) {
  const aElt = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (isActive && aElt.current) {
      aElt.current.click();
    }
  }, []);

  return (
    <a
      ref={aElt}
      f-partial={fPartial}
      href={href}
      class={`flex flex-col items-center gap-1 text-center border-l-4 pr-2 pl-1 py-2 border-transparent aria-[current=page]:border-primary aria-[current=page]:text-primary hover:bg-slate-200`}
      onClick={() => pageDrawerIsOpen.value = true}
    >
      <Icon size={32} />
      <div class="uppercase" style="font-size: 0.625rem">{children}</div>
    </a>
  );
}
