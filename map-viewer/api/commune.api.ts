import { parseResponse } from "@hono/hono/client";
import { Commune, EntityId } from "@scope/types/models";
import { WithRequiredFields } from "@scope/types/utils";
import { BaseApi } from "@/api/base.api.ts";

export class CommuneApi extends BaseApi {
  async getWithGeoJsonById(
    id: EntityId,
  ): Promise<WithRequiredFields<Commune, "geojson">> {
    const commune = await parseResponse(this.client.api.communes[":id"].$get({
      param: { id: id.toString() },
      query: { include_geojson: "1" },
    }));
    return commune as WithRequiredFields<Commune, "geojson">;
  }
}

let _instance: CommuneApi | null = null;

export function injectCommuneApi(): CommuneApi {
  return (_instance ??= new CommuneApi());
}
