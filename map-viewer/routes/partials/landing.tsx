import { Partial } from "fresh/runtime";
import { RouteConfig } from "fresh";
import LandingPage from "@/components/LandingPage.tsx";
import { define } from "../../utils.ts";

// We only want to render the content, so disable
// the `_app.tsx` template as well as any potentially
// inherited layouts
export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export default define.page(function Landing(_ctx) {
  return (
    <Partial name="route-page">
      <LandingPage />
    </Partial>
  );
});
