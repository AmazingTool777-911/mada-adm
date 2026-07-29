import { useEffect } from "preact/hooks";
import { MadaAdmConfig } from "@scope/types/models";
import { useStoresContext } from "@/islands/contexts/stores/index.ts";

export type ViewConfigModalConfigStoreSetterProps = {
  config: MadaAdmConfig | null;
};

export default function ViewConfigModalConfigStoreSetter(
  { config }: ViewConfigModalConfigStoreSetterProps,
) {
  const apiStore = useStoresContext().injectApiStore();

  useEffect(() => {
    apiStore.config.value = config;
    apiStore.configIsLoaded.value = true;
  }, []);

  return null;
}
