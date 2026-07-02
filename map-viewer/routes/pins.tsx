import { Head } from "fresh/runtime";
import PinsPage from "@/components/PinsPage.tsx";
import { define } from "../utils.ts";

export default define.page(function PinnedLocations(_ctx) {
  return (
    <>
      <Head>
        <title>Pinned locations | Map Viewer | Mada ADM</title>
      </Head>
      <PinsPage />
    </>
  );
});
