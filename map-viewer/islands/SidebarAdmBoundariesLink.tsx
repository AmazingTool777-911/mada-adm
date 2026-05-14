import { Landmark } from "lucide-preact";
import SidebarNavLink from "@/islands/SidebarNavLink.tsx";

export type SidebarAdmBoundariesLinkProps = {
  isActive?: boolean;
};

export default function SidebarAdmBoundariesLink({
  isActive = false,
}: SidebarAdmBoundariesLinkProps) {
  return (
    <SidebarNavLink
      href="/adm"
      fPartial="/partials/adm"
      Icon={Landmark}
      isActive={isActive}
    >
      ADM boundaries
    </SidebarNavLink>
  );
}
