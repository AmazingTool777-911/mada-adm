import type { AdmLevelCode } from "@scope/consts/models";
import { define } from "@/utils.ts";
import { ADM_GEOJSON_DATA_SOURCE_BY_CODE } from "@/consts/adm-geojson.consts.ts";
import { GetAdmGeojsonFileSizeResponseItem } from "@/types/api.d.ts";

export const handler = define.handlers({
  GET(ctx) {
    const sources = ctx.params.admLevel.split(",") as AdmLevelCode[];
    for (const source of sources) {
      const _source = ADM_GEOJSON_DATA_SOURCE_BY_CODE.get(source);
      if (!_source) {
        return new Response(
          JSON.stringify({
            error: `The ADM GeoJSON source data is not found for ${source}`,
          }),
          { status: 404 },
        );
      }
    }

    const fileSizesByAdmLevelCode: GetAdmGeojsonFileSizeResponseItem[] = [];

    for (const source of sources) {
      const sourceData = ADM_GEOJSON_DATA_SOURCE_BY_CODE.get(source)!;
      fileSizesByAdmLevelCode.push({
        admLevelCode: source,
        rawURL: sourceData.rawURL,
        previewURL: sourceData.previewURL,
        fileSize: sourceData.fileSize,
      });
    }

    return new Response(JSON.stringify(fileSizesByAdmLevelCode), {
      status: 200,
    });
  },
});
