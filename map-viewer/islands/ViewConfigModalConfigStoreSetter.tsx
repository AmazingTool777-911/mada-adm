import { useEffect } from "preact/hooks";
import { MadaAdmConfig } from "@scope/types/models";
import { injectApiStore } from "@/stores/api.store.ts";

export type ViewConfigModalConfigStoreSetterProps = {
  config: MadaAdmConfig;
};

export default function ViewConfigModalConfigStoreSetter(
  { config }: ViewConfigModalConfigStoreSetterProps,
) {
  const apiStore = injectApiStore();

  useEffect(() => {
    apiStore.config.value = config;
  }, []);

  return null;
}
