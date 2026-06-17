import { hc } from "@hono/hono/client";
import type { AppType } from "@scope/rest-api";

export abstract class BaseApi {
  protected readonly client = hc<AppType>(
    Deno.env.get("FRESH_PUBLIC_REST_API_BASE_URL") ??
      "http://localhost:8000",
  );
}
