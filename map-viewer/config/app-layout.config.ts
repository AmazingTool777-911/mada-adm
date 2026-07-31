export const PAGE_CONTENT_DRAWER_DEFAULT_OPEN =
  Deno.env.get("FRESH_PUBLIC_PAGE_CONTENT_DRAWER_DEFAULT_OPEN")
    ? (
      Deno.env.get("FRESH_PUBLIC_PAGE_CONTENT_DRAWER_DEFAULT_OPEN")!
        .toLowerCase() === "true"
    )
    : false;
