import { Head } from "fresh/runtime";
import AdmExplorerPage from "@/components/AdmExplorerPage.tsx";
import { define } from "../utils.ts";

export default define.page(function AdministrativeBoundaries(_ctx) {
  const title = "Administrative boundaries explorer | Map Viewer | Mada ADM";
  const description =
    "Explore the administrative boundaries data of Madagascar through flexible search modes.";

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
      <AdmExplorerPage />
    </>
  );
});
