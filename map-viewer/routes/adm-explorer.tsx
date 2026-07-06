import { Head } from "fresh/runtime";
import AdmExplorerPage from "@/components/AdmExplorerPage.tsx";
import { define } from "../utils.ts";

export default define.page(function AdministrativeBoundaries(_ctx) {
  return (
    <>
      <Head>
        <title>
          Administrative boundaries explorer | Map Viewer | Mada ADM
        </title>
      </Head>
      <AdmExplorerPage />
    </>
  );
});
