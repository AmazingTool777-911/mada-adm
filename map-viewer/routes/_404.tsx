import { define } from "../utils.ts";
import { Head } from "fresh/runtime";
import notFoundIconURL from "@/assets/not-found-icon.jpg";

export default define.page(function NotFoundPage() {
  return (
    <>
      <Head>
        <title>Page not found</title>
      </Head>
      <header class="text-center flex flex-col items-center">
        <h1 class="text-lg font-bold">404 Not Found</h1>
        <img src={notFoundIconURL} alt="Lost on map" class="max-w-3xs" />
        <p class="text-base-content/80 text-sm max-w-2xs">
          The page you are looking for does not exist.
        </p>
        <a
          href="/"
          f-partial="/partials/landing"
          className="mt-4 btn btn-primary"
        >
          Go to the homepage
        </a>
      </header>
    </>
  );
});
