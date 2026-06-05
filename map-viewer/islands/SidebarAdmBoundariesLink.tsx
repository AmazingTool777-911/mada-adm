import { Search } from "lucide-preact";
import SidebarNavLink from "@/islands/SidebarNavLink.tsx";

export type SidebarAdmBoundariesLinkProps = {
  isActive?: boolean;
};

export default function SidebarAdmBoundariesLink({
  isActive = false,
}: SidebarAdmBoundariesLinkProps) {
  return (
    <SidebarNavLink
      href="/adm-explorer"
      fPartial="/partials/adm-explorer"
      Icon={Search}
      isActive={isActive}
      tooltip="Administrative explorer"
    >
      ADM explorer
    </SidebarNavLink>
  );
}
