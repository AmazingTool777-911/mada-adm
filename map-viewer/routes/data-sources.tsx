import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import DataSourcesPage from "@/components/DataSourcesPage.tsx";
import WalkthroughResumer from "@/islands/WalkthroughResumer.tsx";

export default define.page(function DataSources(_ctx) {
  const title = "Data sources | Map Viewer | Mada ADM";
  const description =
    "View the data sources of the app's database and enable them as layers.";

  return (
    <>
      <WalkthroughResumer resumeSteps={[10, 11, 12]} />
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
      <DataSourcesPage />
    </>
  );
});
