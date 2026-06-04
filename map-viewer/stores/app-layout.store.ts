import { signal } from "@preact/signals";

export class AppLayoutStore {
  readonly sidebarIsOpen = signal(false);

  toggleSidebar(isOpen?: boolean) {
    this.sidebarIsOpen.value = typeof isOpen === "boolean"
      ? isOpen
      : !this.sidebarIsOpen.value;
  }

  readonly firstNavLinkIsLoaded = signal(false);
}

let appLayoutStore: AppLayoutStore | null = null;

export function injectAppLayoutStore(): AppLayoutStore {
  return appLayoutStore ??= new AppLayoutStore();
}
