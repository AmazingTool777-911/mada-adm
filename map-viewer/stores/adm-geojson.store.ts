import { signal } from "@preact/signals";
import { AdmLevelCode } from "@scope/consts/models";
import { AdmGeojsonClientCacheItem } from "@/client-cache/adm-geojson.client-cache.ts";

export type AdmGeojsonDataActiveDownloadItem = {
  admLevelCode: AdmLevelCode;
  status: "idle" | "downloading" | "success" | "failed";
  downloadedFileSize: number;
  fileSize?: number;
};

export const admGeojsonDataActiveDownloads = signal<
  AdmGeojsonDataActiveDownloadItem[]
>([]);

function findAdmGeojsonDataActiveDownloadItemIndexByCode(
  code: AdmLevelCode,
) {
  return admGeojsonDataActiveDownloads.value.findIndex((item) =>
    item.admLevelCode === code
  );
}

export function upsertAdmGeojsonDataActiveDownloadItem(
  item: AdmGeojsonDataActiveDownloadItem,
) {
  const index = findAdmGeojsonDataActiveDownloadItemIndexByCode(
    item.admLevelCode,
  );
  if (index !== -1) {
    admGeojsonDataActiveDownloads.value = [
      ...admGeojsonDataActiveDownloads.value,
    ];
    admGeojsonDataActiveDownloads.value[index] = item;
  } else {
    admGeojsonDataActiveDownloads.value = [
      ...admGeojsonDataActiveDownloads.value,
      item,
    ];
  }
}

export function removeAdmGeojsonDataActiveDownloadItem(
  code: AdmLevelCode,
) {
  admGeojsonDataActiveDownloads.value = admGeojsonDataActiveDownloads.value
    .filter(
      (item) => item.admLevelCode !== code,
    );
}

export const admGeojsonDataVersionByCode = signal<Map<AdmLevelCode, number>>();

export const admGeojsonData = signal<AdmGeojsonClientCacheItem[]>([]);

export function upsertAdmGeojsonData(item: AdmGeojsonClientCacheItem) {
  const index = admGeojsonData.value.findIndex((i) =>
    i.admLevelCode === item.admLevelCode
  );
  if (index !== -1) {
    admGeojsonData.value = [...admGeojsonData.value];
    admGeojsonData.value[index] = item;
  } else {
    admGeojsonData.value = [...admGeojsonData.value, item];
  }
}
