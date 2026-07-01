import { parseResponse } from "@hono/hono/client";
import { District, EntityId } from "@scope/types/models";
import { WithRequiredFields } from "@scope/types/utils";
import { BaseApi } from "@/api/base.api.ts";

export class DistrictApi extends BaseApi {
  async getWithGeoJsonById(
    id: EntityId,
  ): Promise<WithRequiredFields<District, "geojson">> {
    const district = await parseResponse(this.client.api.districts[":id"].$get({
      param: { id: id.toString() },
      query: { include_geojson: "1" },
    }));
    return district as WithRequiredFields<District, "geojson">;
  }

  async getWithGeoJsonByFokontanyId(
    fokontanyId: EntityId,
  ): Promise<WithRequiredFields<District, "geojson">> {
    const district = await parseResponse(
      this.client.api.fokontanys[":id"].district.$get({
        param: { id: fokontanyId.toString() },
        query: { include_geojson: "1" },
      }),
    );
    return district as WithRequiredFields<District, "geojson">;
  }
}

let _instance: DistrictApi | null = null;

export function injectDistrictApi(): DistrictApi {
  return (_instance ??= new DistrictApi());
}
