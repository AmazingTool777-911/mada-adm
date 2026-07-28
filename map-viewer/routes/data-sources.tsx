import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import DataSourcesPage from "@/components/DataSourcesPage.tsx";
import WalkthroughResumer from "@/islands/WalkthroughResumer.tsx";

export default define.page(function DataSources(_ctx) {
  return (
    <>
      <WalkthroughResumer resumeSteps={[10, 11, 12]} />
      <Head>
        <title>Data Sources | Map Viewer | Mada ADM</title>
      </Head>
      <DataSourcesPage />
    </>
  );
});
