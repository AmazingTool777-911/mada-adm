import { BaseApi } from "@/api/base.api.ts";

export class AdmEntityApi extends BaseApi {
  async getAllInBatch() {
    const res = await this.client.api.adm_entities.in_batch.$get();
    return res.json();
  }
}

let instance: AdmEntityApi | null = null;

export function injectAdmEntityApi(): AdmEntityApi {
  if (!instance) {
    instance = new AdmEntityApi();
  }
  return instance;
}
