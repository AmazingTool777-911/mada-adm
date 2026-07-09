import { signal } from "@preact/signals";

export class PinLocationPanelStore {
  readonly showPanel = signal(false);
}

let _instance: PinLocationPanelStore | null = null;

export function injectPinLocationPanelStore(): PinLocationPanelStore {
  return _instance ??= new PinLocationPanelStore();
}
