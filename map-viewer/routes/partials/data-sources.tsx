import { Partial } from "fresh/runtime";
import { RouteConfig } from "fresh";
import { define } from "../../utils.ts";
import DataSourcesPage from "@/components/DataSourcesPage.tsx";

// We only want to render the content, so disable
// the `_app.tsx` template as well as any potentially
// inherited layouts
export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export default define.page(function DataSources(_ctx) {
  return (
    <Partial name="route-page">
      <DataSourcesPage />
    </Partial>
  );
});
