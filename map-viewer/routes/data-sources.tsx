import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import DataSourcesPage from "@/components/DataSourcesPage.tsx";

export default define.page(function DataSources(_ctx) {
  return (
    <>
      <Head>
        <title>Data Sources | Map Viewer | Mada ADM</title>
      </Head>
      <DataSourcesPage />
    </>
  );
});
