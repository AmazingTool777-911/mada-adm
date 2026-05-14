import { Partial } from "fresh/runtime";
import { RouteConfig } from "fresh";
import AdmPage from "@/components/AdmPage.tsx";
import { define } from "../../utils.ts";

// We only want to render the content, so disable
// the `_app.tsx` template as well as any potentially
// inherited layouts
export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export default define.page(function AdministrativeBoundaries(_ctx) {
  return (
    <Partial name="route-page">
      <AdmPage />
    </Partial>
  );
});
