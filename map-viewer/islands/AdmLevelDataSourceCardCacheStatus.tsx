import { Database, DatabaseZap, Download } from "lucide-preact";
import { useComputed } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import {
  AdmGeojsonDataDownloadItem,
  injectAdmGeojsonStore,
} from "@/stores/adm-geojson.store.ts";
import { AdmGeojsonMetadataClientCacheItem } from "@/types/cache.d.ts";

export type AdmLevelDataSourceCardCacheStatusProps = {
  admLevelCode: AdmLevelCode;
};

export default function AdmLevelDataSourceCardCacheStatus(
  { admLevelCode }: AdmLevelDataSourceCardCacheStatusProps,
) {
  const admGeoJsonStore = injectAdmGeojsonStore();

  const cachedMetadata = useComputed<AdmGeojsonMetadataClientCacheItem | null>(
    () => {
      return admGeoJsonStore.cachedMetadata.value.find((metadata) => {
        return metadata.admLevelCode === admLevelCode;
      }) ?? null;
    },
  );

  const isCached = useComputed(() => {
    return admGeoJsonStore.cachedMetadataIsLoaded && !!cachedMetadata.value;
  });

  const admLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(admLevelCode)!;
  const sectionTitle =
    `Cache status of the ${admLevelCode}: ${admLevelTitle}s layer`;

  const cacheLastUpdatedAtFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
  const cacheLastUpdatedAt = useComputed<string | null>(() => {
    if (!cachedMetadata.value) return null;
    return "Last updated: " +
      cacheLastUpdatedAtFormatter.format(cachedMetadata.value.lastModified);
  });

  const currentDownload = useComputed<AdmGeojsonDataDownloadItem | null>(() => {
    return admGeoJsonStore.downloads.value.find((d) =>
      d.admLevelCode === admLevelCode
    ) ?? null;
  });
  const currentDownloadIsDownloadable = useComputed(() => {
    return !currentDownload.value || currentDownload.value.status === "failed";
  });

  const hasNewVersion = useComputed(() => {
    if (
      !admGeoJsonStore.admGeoJsonDataVersionByCode.value ||
      !cachedMetadata.value
    ) return false;
    return admGeoJsonStore.admGeoJsonDataVersionByCode.value.get(
      admLevelCode,
    )! > cachedMetadata.value.version;
  });

  useEffect(() => {
    return () => {
      admGeoJsonStore.removeAdmLevelDownload(admLevelCode);
    };
  }, []);

  async function handleDownloadClick() {
    if (cachedMetadata.value) {
      await admGeoJsonStore.downloadForAdmLevel(admLevelCode);
    } else {
      admGeoJsonStore.openDownloadModal([admLevelCode]);
    }
  }

  return (
    <>
      {admGeoJsonStore.cachedMetadataIsLoaded.value && (
        <>
          <hr class="my-3 text-slate-300" />
          <section
            aria-label={sectionTitle}
            class="space-y-2"
            data-adm-geojson-download={admLevelCode}
          >
            <div class="flex justify-between items-center">
              <div class="space-y-1">
                <strong
                  title={cacheLastUpdatedAt.value ?? undefined}
                  class={"flex items-center gap-x-2 text-sm font-medium " +
                    (isCached.value ? "text-success" : "text-error")}
                >
                  {isCached.value
                    ? <DatabaseZap size={18} />
                    : <Database size={18} />}
                  <span>
                    {isCached.value ? "Cached" : "Not cached"}
                  </span>
                </strong>
                {hasNewVersion.value && (
                  <em
                    class="flex items-center gap-x-2 text-xs font-semibold"
                    style="font-style: normal"
                  >
                    <span
                      class="bg-warning inline-block"
                      style="width: 8px; height: 8px; border-radius: 50%"
                    >
                    </span>
                    New version available
                  </em>
                )}
              </div>
              {(!isCached.value || (isCached.value && hasNewVersion.value)) && (
                currentDownloadIsDownloadable.value
                  ? (
                    <button
                      type="button"
                      class="btn btn-primary btn-outline btn-sm"
                      onClick={handleDownloadClick}
                    >
                      <Download size={18} />
                      <span>Download</span>
                    </button>
                  )
                  : (
                    <span class="text-sm text-base-content/70">
                      ... Downloading
                    </span>
                  )
              )}
            </div>
            {currentDownload.value && (
              <div>
                <div class="flex justify-between text-base-content/80 text-xs">
                  <p>
                    {currentDownload.value.status === "idle"
                      ? (
                        "Starting download ..."
                      )
                      : (
                        <>
                          {parseFloat(
                            (currentDownload.value.downloaded / 1024 ** 2)
                              .toFixed(1),
                          )} MB
                          <span class="mx-2">/</span>
                          {currentDownload.value.total
                            ? (parseFloat(
                              (currentDownload.value.total / 1024 ** 2)
                                .toFixed(
                                  1,
                                ),
                            ) + " MB")
                            : "Inderterminate"}
                        </>
                      )}
                  </p>
                  {currentDownload.value.status !== "idle" && (
                    <p>
                      {currentDownload.value.total
                        ? Math.round(
                          currentDownload.value.downloaded /
                            (currentDownload.value.total) * 100,
                        )
                        : 0} %
                    </p>
                  )}
                </div>
                {currentDownload.value.status === "success"
                  ? <p class="text-success text-xs mt-1">Download completed</p>
                  : (
                    currentDownload.value.status === "failed"
                      ? <p class="text-error text-xs mt-1">Download failed</p>
                      : (
                        <progress
                          value={currentDownload.value.status === "downloading"
                            ? currentDownload.value.downloaded
                            : undefined}
                          max={currentDownload.value.total}
                          className="progress progress-primary w-full"
                        >
                        </progress>
                      )
                  )}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
