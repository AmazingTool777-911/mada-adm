import { parseResponse } from "@hono/hono/client";
import { EntityId, Fokontany } from "@scope/types/models";
import { WithRequiredFields } from "@scope/types/utils";
import { BaseApi } from "@/api/base.api.ts";

export class FokontanyApi extends BaseApi {
  async getWithGeoJsonById(
    id: EntityId,
  ): Promise<WithRequiredFields<Fokontany, "geojson">> {
    const fokontany = await parseResponse(
      this.client.api.fokontanys[":id"].$get({
        param: { id: id.toString() },
        query: { include_geojson: "1" },
      }),
    );
    return fokontany as WithRequiredFields<Fokontany, "geojson">;
  }
}

let _instance: FokontanyApi | null = null;

export function injectFokontanyApi(): FokontanyApi {
  return (_instance ??= new FokontanyApi());
}
