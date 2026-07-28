import { Pin } from "lucide-preact";
import SidebarNavLink from "@/islands/SidebarNavLink.tsx";

export type SidebarPinsLinkProps = {
  isActive?: boolean;
};

export default function SidebarPinsLink({
  isActive = false,
}: SidebarPinsLinkProps) {
  return (
    <SidebarNavLink
      href="/pins"
      fPartial="/partials/pins"
      id="sidebar-pins-link"
      Icon={Pin}
      isActive={isActive}
      tooltip="Pinned locations"
    >
      Pinned locations
    </SidebarNavLink>
  );
}
