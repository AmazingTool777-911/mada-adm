import { Database } from "lucide-preact";
import SidebarNavLink from "@/islands/SidebarNavLink.tsx";

export type SidebarDataSourcesLinkProps = {
  isActive?: boolean;
};

export default function SidebarDataSourcesLink({
  isActive = false,
}: SidebarDataSourcesLinkProps) {
  return (
    <SidebarNavLink
      href="/data-sources"
      fPartial="/partials/data-sources"
      Icon={Database}
      isActive={isActive}
    >
      Data sources
    </SidebarNavLink>
  );
}
