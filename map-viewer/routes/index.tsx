import { Head } from "fresh/runtime";
import LandingPage from "@/components/LandingPage.tsx";
import { define } from "../utils.ts";

export default define.page(function Home(_ctx) {
  const title = "Map Viewer | Mada ADM";
  const description =
    "An interactive map viewer for Madagascar administrative boundaries.";

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
      <LandingPage />
    </>
  );
});
