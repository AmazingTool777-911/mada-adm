import { computed, signal } from "@preact/signals";
import { AdmLevelCode } from "@scope/consts/models";
import { ADM_GEOJSON_DATA_SOURCE_BY_CODE } from "@/consts/adm-geojson.consts.ts";
import { GeoJSONFeature, GeoJSONFeatureCollection } from "@scope/types/utils";
import type { GetAdmGeojsonFileSizeResponseItem } from "@/types/api.d.ts";
import type { AdmGeojsonMetadataClientCacheItem } from "@/types/cache.d.ts";

export type AdmGeojsonDataDownloadItem = {
  admLevelCode: AdmLevelCode;
  downloaded: number;
  status: "idle" | "downloading" | "success" | "failed";
  total?: number;
  geojson?: GeoJSONFeatureCollection<Record<string, unknown>>;
};

export class AdmGeoJsonStore {
  readonly downloads = signal<AdmGeojsonDataDownloadItem[]>([]);

  readonly downloadByAdmLevelCode = computed<
    Map<AdmLevelCode, AdmGeojsonDataDownloadItem>
  >(() => {
    return new Map(this.downloads.value.map((d) => [d.admLevelCode, d]));
  });

  private upsertDownload(download: AdmGeojsonDataDownloadItem) {
    const i = this.downloads.value.findIndex(
      (d) => d.admLevelCode === download.admLevelCode,
    );
    if (i === -1) {
      this.downloads.value = [...this.downloads.value, download];
    } else {
      this.downloads.value[i] = download;
      this.downloads.value = [...this.downloads.value];
    }
  }

  async downloadForAdmLevel(
    admLevelCode: AdmLevelCode,
  ): Promise<GeoJSONFeatureCollection<Record<string, unknown>>> {
    const { isNDJSON } = ADM_GEOJSON_DATA_SOURCE_BY_CODE.get(admLevelCode)!;

    const download: AdmGeojsonDataDownloadItem = {
      admLevelCode,
      downloaded: 0,
      status: "idle",
    };
    this.upsertDownload(download);

    try {
      const url = `/api/adm-geojson/${admLevelCode}`;
      const response = await fetch(url);
      download.status = "downloading";

      const contentLengthHeader = response.headers.get("Content-Length");
      if (contentLengthHeader) {
        const fileSize = Number(contentLengthHeader);
        download.total = fileSize;
      }
      this.upsertDownload({ ...download });

      let geojsonFeatureCollection!: GeoJSONFeatureCollection<
        Record<string, unknown>
      >;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader for the response");
      }

      const geojsonFeatures: GeoJSONFeature<Record<string, unknown>>[] = [];
      const textDecoder = new TextDecoder();
      let buffer = "";

      let downloadThottlingTimeout: ReturnType<typeof setTimeout> | null = null;
      const downloadThottlingTimeoutDuration = 250;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        download.downloaded += value.length;

        if (!downloadThottlingTimeout) {
          this.upsertDownload({ ...download });
          downloadThottlingTimeout = setTimeout(() => {
            this.upsertDownload({ ...download });
            downloadThottlingTimeout = null;
          }, downloadThottlingTimeoutDuration);
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

      if (downloadThottlingTimeout) {
        clearTimeout(downloadThottlingTimeout);
      }

      if (isNDJSON) {
        geojsonFeatures.push(
          JSON.parse(buffer) as GeoJSONFeature<Record<string, unknown>>,
        );
        geojsonFeatureCollection = {
          type: "FeatureCollection",
          features: geojsonFeatures,
        };
      } else {
        geojsonFeatureCollection = JSON.parse(
          buffer,
        ) as GeoJSONFeatureCollection<Record<string, unknown>>;
      }

      download.status = "success";
      this.upsertDownload({ ...download, geojson: geojsonFeatureCollection });

      return geojsonFeatureCollection;
    } catch (error) {
      download.status = "failed";
      this.upsertDownload({ ...download });
      throw error;
    }
  }

  removeAdmLevelDownload(admLevelCode: AdmLevelCode) {
    this.downloads.value = this.downloads.value.filter(
      (d) => d.admLevelCode !== admLevelCode,
    );
  }

  readonly downloadModalIsOpen = signal(false);
  readonly admLevelCodesToBeDownloaded = signal<AdmLevelCode[]>([]);
  readonly isLoadingFileSizes = signal(false);
  readonly fileSizesLoadingError = signal(false);
  readonly fileSizes = signal<GetAdmGeojsonFileSizeResponseItem[]>([]);

  async openDownloadModal(admLevelCodes?: AdmLevelCode[]) {
    this.isLoadingFileSizes.value = true;
    this.downloadModalIsOpen.value = true;
    this.fileSizesLoadingError.value = false;
    this.fileSizes.value = [];
    admLevelCodes && (this.admLevelCodesToBeDownloaded.value = admLevelCodes);

    try {
      const concatedAdmLevelCodes = this.admLevelCodesToBeDownloaded.value.join(
        ",",
      );
      const url = `/api/adm-geojson/${concatedAdmLevelCodes}/file-size`;
      const fileSizesData = await fetch(url).then((res) =>
        res.json()
      ) as GetAdmGeojsonFileSizeResponseItem[];

      this.fileSizes.value = fileSizesData;
    } catch (_) {
      this.fileSizesLoadingError.value = true;
    } finally {
      this.isLoadingFileSizes.value = false;
    }
  }

  closeDownloadModal() {
    this.downloadModalIsOpen.value = false;
    this.isLoadingFileSizes.value = false;
    this.fileSizes.value = [];
    this.admLevelCodesToBeDownloaded.value = [];
  }

  cachedMetadata = signal<AdmGeojsonMetadataClientCacheItem[]>([]);

  cachedMetadataCodes = computed<Set<AdmLevelCode>>(() => {
    return new Set(
      this.cachedMetadata.value.map((d) => d.admLevelCode),
    );
  });

  upsertCachedMetadata(metadata: AdmGeojsonMetadataClientCacheItem) {
    const i = this.cachedMetadata.value.findIndex(
      (d) => d.admLevelCode === metadata.admLevelCode,
    );
    if (i === -1) {
      this.cachedMetadata.value = [...this.cachedMetadata.value, metadata];
    } else {
      this.cachedMetadata.value[i] = metadata;
      this.cachedMetadata.value = [...this.cachedMetadata.value];
    }
  }
}

let admGeoJsonStore: AdmGeoJsonStore | null = null;

export function injectAdmGeojsonStore(): AdmGeoJsonStore {
  return admGeoJsonStore ??= new AdmGeoJsonStore();
}
