import { Head } from "fresh/runtime";
import PinsPage from "@/components/PinsPage.tsx";
import { define } from "../utils.ts";

export default define.page(function PinnedLocations(_ctx) {
  const title = "Pinned locations | Map Viewer | Mada ADM";
  const description =
    "Pin custom locations to the map; then, view and organize them in one place.";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Map Viewer by Mada ADM" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </Head>
      <PinsPage />
    </>
  );
});
