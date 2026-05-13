import type { AdmLevelCode } from "@scope/consts/models";
import { define } from "@/utils.ts";
import { ADM_GEOJSON_DATA_SOURCE_BY_CODE } from "@/consts/adm-geojson.consts.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const source = ADM_GEOJSON_DATA_SOURCE_BY_CODE.get(
      ctx.params.admLevel as AdmLevelCode,
    );

    if (!source) {
      return new Response(
        JSON.stringify({
          error:
            `The ADM GeoJSON source data is not found for ${ctx.params.admLevel}`,
        }),
        { status: 404 },
      );
    }

    const fetchFileResponse = await fetch(source.url);

    return new Response(fetchFileResponse.body, {
      headers: {
        "Content-Type": fetchFileResponse.headers.get("content-type") ||
          "application/octet-stream",
        ...(fetchFileResponse.headers.get("content-length") && {
          "Content-Length": fetchFileResponse.headers.get("content-length")!,
        }),
      },
      status: 200,
    });
  },
});
