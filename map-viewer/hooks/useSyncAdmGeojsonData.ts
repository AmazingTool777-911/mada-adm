import { useEffect } from "preact/hooks";
import { AdmLevelCode } from "@scope/consts/models";
import type {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
} from "@scope/types/utils";
import { injectClientCacheIndexdDbConnection } from "@/client-cache/client-cache.indexeddb.ts";
import {
  AdmGeojsonClientCacheItem,
  injectAdmGeojsonClientCache,
} from "@/client-cache/adm-geojson.client-cache.ts";
import {
  admGeojsonData,
  type AdmGeojsonDataActiveDownloadItem,
  admGeojsonDataActiveDownloads,
  admGeojsonDataVersionByCode,
  removeAdmGeojsonDataActiveDownloadItem,
  upsertAdmGeojsonData,
  upsertAdmGeojsonDataActiveDownloadItem,
} from "@/stores/adm-geojson.store.ts";
import { ADM_GEOJSON_DATA_SOURCE_BY_CODE } from "@/consts/adm-geojson.consts.ts";

export default function useSyncAdmGeojsonData() {
  const clientCacheConnection = injectClientCacheIndexdDbConnection();
  const admGeojsonClientCache = injectAdmGeojsonClientCache(
    clientCacheConnection,
  );

  useEffect(() => {
    console.log("Updated !!!");
  }, [admGeojsonData.value]);

  useEffect(() => {
    admGeojsonClientCache.getAll().then((data) => {
      console.log("admGeojsonData", data);
      admGeojsonData.value = data;

      const item = data.find((item) =>
        item.admLevelCode === AdmLevelCode.REGION
      );
      if (item) {
        admGeojsonClientCache.upsert({
          ...item,
          lastModified: new Date(),
          version: 0,
        });
      }
    });
  }, []);

  useEffect(() => {
    console.log(
      "admGeojsonDataActiveDownloads",
      admGeojsonDataActiveDownloads.value,
    );
  }, [admGeojsonDataActiveDownloads.value]);

  async function syncAdmGeojsonDataForCode(
    code: AdmLevelCode,
  ): Promise<AdmGeojsonClientCacheItem> {
    const isNDJSON = (ADM_GEOJSON_DATA_SOURCE_BY_CODE.get(code)!).isNDJSON;

    const activeDownloadItem: AdmGeojsonDataActiveDownloadItem = {
      admLevelCode: code,
      status: "idle",
      downloadedFileSize: 0,
    };
    upsertAdmGeojsonDataActiveDownloadItem(activeDownloadItem);

    try {
      const url = `/api/adm-geojson/${code}`;
      const response = await fetch(url);
      const fileSize = Number(response.headers.get("Content-Length"));
      activeDownloadItem.status = "downloading";
      activeDownloadItem.fileSize = fileSize;
      upsertAdmGeojsonDataActiveDownloadItem({ ...activeDownloadItem });

      let geojsonFeatureCollection: GeoJSONFeatureCollection<
        Record<string, unknown>
      > = {
        type: "FeatureCollection",
        features: [],
      };
      const geojsonFeatures: GeoJSONFeature<Record<string, unknown>>[] = [];
      const textDecoder = new TextDecoder();
      let buffer = "";

      const reader = response.body?.getReader();
      if (reader) {
        let activeDownloadUpsertTimeout: ReturnType<typeof setTimeout> | null =
          null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          activeDownloadItem.downloadedFileSize += value.length;

          if (!activeDownloadUpsertTimeout) {
            upsertAdmGeojsonDataActiveDownloadItem({ ...activeDownloadItem });
            activeDownloadUpsertTimeout = setTimeout(() => {
              upsertAdmGeojsonDataActiveDownloadItem({ ...activeDownloadItem });
              activeDownloadUpsertTimeout = null;
            }, 250);
          }

          const chunkText = textDecoder.decode(value, { stream: true });
          if (isNDJSON) {
            const lines = (buffer + chunkText).split("\n").filter((line) =>
              !!line
            );
            buffer = lines.pop() ?? "";
            geojsonFeatures.push(
              ...lines.map((line) =>
                JSON.parse(line) as GeoJSONFeature<Record<string, unknown>>
              ),
            );
          } else {
            buffer += chunkText;
          }
        }
        geojsonFeatures.push(
          JSON.parse(buffer) as GeoJSONFeature<Record<string, unknown>>,
        );

        activeDownloadItem.status = "success";

        if (isNDJSON) {
          geojsonFeatureCollection.features = geojsonFeatures;
        } else {
          geojsonFeatureCollection = JSON.parse(
            buffer,
          ) as GeoJSONFeatureCollection<Record<string, unknown>>;
        }

        if (activeDownloadUpsertTimeout) {
          clearTimeout(activeDownloadUpsertTimeout);
        }
        upsertAdmGeojsonDataActiveDownloadItem({ ...activeDownloadItem });

        setTimeout(() => {
          removeAdmGeojsonDataActiveDownloadItem(code);
        }, 3000);

        const admGeojsonDataItem: AdmGeojsonClientCacheItem = {
          admLevelCode: code,
          geojson: geojsonFeatureCollection,
          version: admGeojsonDataVersionByCode.value?.get(code) || 1,
          lastModified: new Date(),
        };
        await admGeojsonClientCache.upsert(admGeojsonDataItem);
        upsertAdmGeojsonData(admGeojsonDataItem);

        return admGeojsonDataItem;
      } else {
        throw new Error("No reader for the response");
      }
    } catch (error) {
      activeDownloadItem.status = "failed";
      upsertAdmGeojsonDataActiveDownloadItem({ ...activeDownloadItem });
      throw error;
    }
  }

  return { syncAdmGeojsonDataForCode };
}
