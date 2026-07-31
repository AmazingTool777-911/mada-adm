import { Head, Partial } from "fresh/runtime";
import { RouteConfig } from "fresh";
import PinsPage from "@/components/PinsPage.tsx";
import { define } from "../../utils.ts";

// We only want to render the content, so disable
// the `_app.tsx` template as well as any potentially
// inherited layouts
export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export default define.page(function PinnedLocations(_ctx) {
  return (
    <Partial name="route-page">
      <Head>
        <title>Pinned locations | Map Viewer | Mada ADM</title>
      </Head>
      <PinsPage />
    </Partial>
  );
});
