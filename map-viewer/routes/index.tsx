import { Head } from "fresh/runtime";
import LandingPage from "@/components/LandingPage.tsx";
import { define } from "../utils.ts";

export default define.page(function Home(_ctx) {
  return (
    <>
      <Head>
        <title>Map Viewer | Mada ADM</title>
      </Head>
      <LandingPage />
    </>
  );
});
