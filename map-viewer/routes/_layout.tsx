import { Partial } from "fresh/runtime";
import { define } from "../utils.ts";
// import BaseMap from "@/islands/BaseMap.tsx";
// import { AdmLevelCode } from "@scope/consts/models";
import AppMap from "@/islands/AppMap.tsx";
import AppLogoLink from "@/islands/AppLogoLink.tsx";
import SidebarAdmBoundariesLink from "@/islands/SidebarAdmBoundariesLink.tsx";
import SidebarDataSourcesLink from "@/islands/SidebarDataSourcesLink.tsx";
import SidebarPinsLink from "@/islands/SidebarPinsLink.tsx";
import ViewConfigModal from "@/islands/ViewConfigModal.tsx";
import RoutePageDrawer from "@/islands/RoutePageDrawer.tsx";

export default define.layout(({ Component, url }) => {
  // const admGeojsonDataVersionByCode = new Map<AdmLevelCode, number>([
  //   [
  //     AdmLevelCode.PROVINCE,
  //     Deno.env.has("PROVINCE_ADM_GEOJSON_VERSION")
  //       ? parseInt(Deno.env.get("PROVINCE_ADM_GEOJSON_VERSION") as string)
  //       : 1,
  //   ],
  //   [
  //     AdmLevelCode.REGION,
  //     Deno.env.has("REGION_ADM_GEOJSON_VERSION")
  //       ? parseInt(Deno.env.get("REGION_ADM_GEOJSON_VERSION") as string)
  //       : 1,
  //   ],
  //   [
  //     AdmLevelCode.DISTRICT,
  //     Deno.env.has("DISTRICT_ADM_GEOJSON_VERSION")
  //       ? parseInt(Deno.env.get("DISTRICT_ADM_GEOJSON_VERSION") as string)
  //       : 1,
  //   ],
  //   [
  //     AdmLevelCode.COMMUNE,
  //     Deno.env.has("COMMUNE_ADM_GEOJSON_VERSION")
  //       ? parseInt(Deno.env.get("COMMUNE_ADM_GEOJSON_VERSION") as string)
  //       : 1,
  //   ],
  //   [
  //     AdmLevelCode.FOKONTANY,
  //     Deno.env.has("FOKONTANY_ADM_GEOJSON_VERSION")
  //       ? parseInt(Deno.env.get("FOKONTANY_ADM_GEOJSON_VERSION") as string)
  //       : 1,
  //   ],
  // ]);

  const isActive = (href: string) => url.pathname === href;

  return (
    <div f-client-nav class="w-screen h-dvh flex">
      <div
        class="border-r border-slate-300 py-3 relative z-10 bg-white"
        style="width: var(--sidebar-width); z-index: calc(var(--base-z-index) + 40)"
      >
        <header class="h-full flex flex-col justify-between gap-y-12">
          <AppLogoLink />
          <nav>
            <ul class="flex flex-col list-none p-0 m-0 gap-y-2">
              <li>
                <SidebarAdmBoundariesLink isActive={isActive("/adm")} />
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
          <div>
            <ViewConfigModal />
          </div>
        </header>
      </div>
      <RoutePageDrawer>
        <Partial name="route-page">
          <Component />
        </Partial>
      </RoutePageDrawer>
      <div className="grow shrink basis-auto h-full">
        {/* <BaseMap admGeojsonDataVersionByCode={admGeojsonDataVersionByCode} /> */}
        <AppMap />
      </div>
    </div>
  );
});
