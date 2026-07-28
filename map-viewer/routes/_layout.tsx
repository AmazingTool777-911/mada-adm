import { Partial } from "fresh/runtime";
import { define } from "../utils.ts";
import { AdmLevelCode } from "@scope/consts/models";
import { MadaAdmConfig } from "@scope/types/models";
import AppMap from "@/islands/AppMap.tsx";
import ViewConfigModal from "@/components/ViewConfigModal.tsx";
import AppLogoLink from "@/islands/AppLogoLink.tsx";
import SidebarAdmExplorerLink from "@/islands/SidebarAdmExplorerLink.tsx";
import SidebarDataSourcesLink from "@/islands/SidebarDataSourcesLink.tsx";
import SidebarPinsLink from "@/islands/SidebarPinsLink.tsx";
import RoutePageDrawer from "@/islands/RoutePageDrawer.tsx";
import AppToasts from "@/islands/AppToasts.tsx";
import { injectMadaAdmConfigApi } from "@/api/mada-adm-config.api.ts";
import { WalkthroughDriverProvider } from "@/islands/contexts/walkthrough-driver/index.ts";
import SidebarWalkthroughBtn from "@/islands/SidebarWalkthroughBtn.tsx";

export default define.layout(async ({ Component, url }) => {
  let madaAdmConfig: MadaAdmConfig | null = null;
  let madaAdmConfigLoadingError: string | null = null;
  try {
    madaAdmConfig = await injectMadaAdmConfigApi().get();
  } catch (error) {
    madaAdmConfigLoadingError = (error as Error).message;
  }

  const admGeojsonDataVersionByCode = new Map<AdmLevelCode, number>([
    [
      AdmLevelCode.PROVINCE,
      Deno.env.has("PROVINCE_ADM_GEOJSON_VERSION")
        ? parseInt(Deno.env.get("PROVINCE_ADM_GEOJSON_VERSION") as string)
        : 1,
    ],
    [
      AdmLevelCode.REGION,
      Deno.env.has("REGION_ADM_GEOJSON_VERSION")
        ? parseInt(Deno.env.get("REGION_ADM_GEOJSON_VERSION") as string)
        : 1,
    ],
    [
      AdmLevelCode.DISTRICT,
      Deno.env.has("DISTRICT_ADM_GEOJSON_VERSION")
        ? parseInt(Deno.env.get("DISTRICT_ADM_GEOJSON_VERSION") as string)
        : 1,
    ],
    [
      AdmLevelCode.COMMUNE,
      Deno.env.has("COMMUNE_ADM_GEOJSON_VERSION")
        ? parseInt(Deno.env.get("COMMUNE_ADM_GEOJSON_VERSION") as string)
        : 1,
    ],
    [
      AdmLevelCode.FOKONTANY,
      Deno.env.has("FOKONTANY_ADM_GEOJSON_VERSION")
        ? parseInt(Deno.env.get("FOKONTANY_ADM_GEOJSON_VERSION") as string)
        : 1,
    ],
  ]);

  const isActive = (href: string) => url.pathname === href;

  return (
    <WalkthroughDriverProvider>
      <div f-client-nav class="w-screen h-dvh max-h-dvh flex">
        <div
          class="border-r border-slate-300 py-3 relative z-10 bg-white"
          style="width: var(--sidebar-width); z-index: calc(var(--base-z-index) + 40)"
        >
          <header class="h-full flex flex-col justify-between gap-y-12">
            <div class="flex flex-col gap-y-5 items-center">
              <AppLogoLink />
              <hr class="text-base-content/20 w-2/3" />
              <nav>
                <ul class="flex flex-col list-none p-0 m-0 gap-x-0">
                  <li>
                    <SidebarAdmExplorerLink
                      isActive={isActive("/adm-explorer")}
                    />
                  </li>
                  <li>
                    <SidebarPinsLink isActive={isActive("/pins")} />
                  </li>
                  <li>
                    <SidebarDataSourcesLink
                      isActive={isActive("/data-sources")}
                    />
                  </li>
                </ul>
              </nav>
            </div>
            <div class="flex flex-col gap-y-3 items-center">
              <SidebarWalkthroughBtn />
              <ViewConfigModal
                config={madaAdmConfig}
                configLoadingError={madaAdmConfigLoadingError}
              />
            </div>
          </header>
        </div>
        <RoutePageDrawer>
          <Partial name="route-page">
            <Component />
          </Partial>
        </RoutePageDrawer>
        <div className="grow shrink basis-auto h-full">
          <AppMap admGeojsonDataVersionByCode={admGeojsonDataVersionByCode} />
        </div>
        <AppToasts />
      </div>
    </WalkthroughDriverProvider>
  );
});
