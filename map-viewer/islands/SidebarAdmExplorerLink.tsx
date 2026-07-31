import { Search } from "lucide-preact";
import SidebarNavLink from "@/islands/SidebarNavLink.tsx";

export type SidebarAdmExplorerLinkProps = {
  isActive?: boolean;
};

export default function SidebarAdmExplorerLink({
  isActive = false,
}: SidebarAdmExplorerLinkProps) {
  return (
    <SidebarNavLink
      href="/adm-explorer"
      fPartial="/partials/adm-explorer"
      id="sidebar-adm-explorer-link"
      Icon={Search}
      isActive={isActive}
      tooltip="Administrative explorer"
    >
      ADM explorer
    </SidebarNavLink>
  );
}
