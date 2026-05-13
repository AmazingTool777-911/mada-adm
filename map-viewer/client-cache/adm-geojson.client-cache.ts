import { AdmLevelCode } from "@scope/consts/models";
import { ADM_GEOJSON_STORE_NAME } from "@/consts/indexeddb.consts.ts";
import { ClientCacheIndexdDbConnection } from "./client-cache.indexeddb.ts";
import type { GeoJSONFeatureCollection } from "@scope/types/utils";

export type AdmGeojsonClientCacheItem = {
  admLevelCode: AdmLevelCode;
  geojson: GeoJSONFeatureCollection<Record<string, unknown>>;
  version: number;
  lastModified: Date;
};

export class AdmGeojsonClientCache {
  readonly store = ADM_GEOJSON_STORE_NAME;

  #connection!: ClientCacheIndexdDbConnection;

  constructor(indexedDbConnection: ClientCacheIndexdDbConnection) {
    this.#connection = indexedDbConnection;
  }

  async getAll(): Promise<AdmGeojsonClientCacheItem[]> {
    const db = await this.#connection.db;
    const transaction = db.transaction(this.store, "readonly");
    const store = transaction.objectStore(this.store);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async upsert(item: AdmGeojsonClientCacheItem): Promise<IDBValidKey> {
    const db = await this.#connection.db;
    const transaction = db.transaction(this.store, "readwrite");
    const store = transaction.objectStore(this.store);

    return new Promise<IDBValidKey>((resolve, reject) => {
      const getRequest = store.get(item.admLevelCode);

      getRequest.onsuccess = () => {
        const writeRequest = getRequest.result !== undefined
          ? store.put(item)
          : store.add(item);

        writeRequest.onsuccess = () => {
          resolve(writeRequest.result);
        };
        writeRequest.onerror = () => {
          reject(writeRequest.error);
        };
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }
}

let _instance: AdmGeojsonClientCache | null = null;

export function injectAdmGeojsonClientCache(
  indexedDbConnection: ClientCacheIndexdDbConnection,
): AdmGeojsonClientCache {
  return _instance ??
    (_instance = new AdmGeojsonClientCache(indexedDbConnection));
}
