import { useEffect, useRef } from "preact/hooks";
import { Signal, useSignal } from "@preact/signals";
import maplibregl from "maplibre-gl";
import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import { AdmEntityDiscriminated } from "@scope/types/models";
import { PinnedLocationEntry } from "@/stores/pinned-locations.store.ts";
import { formatGeographicCoordinates } from "@/helpers/pinned-locations.helper.ts";
import {
  GEOGRAPHIC_COORDINATE_OUTPUT_FORMAT_OPTIONS,
  GeographicCoordinateOutputFormat,
  PINNED_LOCATION_ADM_TERRITORY_ERROR_MESSAGE_BY_CAUSE,
  PinnedLocationErrorCause,
} from "@/consts/pinned-locations.consts.ts";
import { injectClientCacheIndexdDbConnection } from "@/client-cache/client-cache.indexeddb.ts";
import { injectAdmGeojsonClientCache } from "@/client-cache/adm-geojson.client-cache.ts";
import { injectApiStore } from "@/stores/api.store.ts";
import { injectProvinceApi } from "@/api/province.api.ts";
import { injectRegionApi } from "@/api/region.api.ts";
import { injectCommuneApi } from "@/api/commune.api.ts";
import { injectFokontanyApi } from "@/api/fokontany.api.ts";
import {
  AdmEntityDivisionWithEntry,
  injectAppMapStore,
} from "@/stores/app-map.store.ts";
import { injectAdmGeojsonStore } from "@/stores/adm-geojson.store.ts";
import { injectDistrictApi } from "@/api/district.api.ts";

export type UseAddPinnedLocationMarkerPopupOptions = {
  isCurrentLocation?: boolean;
};

export type UseAddPinnedLocationMarkerPopupAdmTerritoryParams = {
  fokontanyDiscriminated: AdmEntityDiscriminated | null;
  fokontanyDivisions: AdmEntityDivisionWithEntry[] | null;
};

export type UseAddPinnedLocationMarkerPopupResult = {
  markerPopup: Signal<maplibregl.Popup | null>;
};

const ADM_TERRITORY_LOADING_HTML =
  `<span title="Resolving the ADM territory ..." class="loading loading-dots loading-sm text-base-content/60"></span>`;
const ADM_TERRITORY_ERROR_HTML =
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangle-alert-icon lucide-triangle-alert text-error" title="Failed to resolve the ADM territory"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;

const ADM_TERRITORY_BODY_LOADING_HTML = `
  <span class="flex items-center gap-x-2 text-xs text-base-content/60 mb-2">
    <span class="loading loading-spinner loading-sm"></span>
    Resolving the ADM territory ...
  </span>
`;

function getAdmTerritoryBodyErrorHTML(
  errorCause: PinnedLocationErrorCause | null | undefined,
) {
  if (!errorCause) return "";
  const errorMessage = PINNED_LOCATION_ADM_TERRITORY_ERROR_MESSAGE_BY_CAUSE.get(
    errorCause,
  );
  return `
    <div class="flex items-start gap-x-2 text-error mb-2">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangle-alert-icon lucide-triangle-alert shrink-0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
      <p class="text-xs">${errorMessage}</p>
    </div>
  `;
}

function getFokontanyDivisionsHTML(
  fokontanyDivisions: AdmEntityDivisionWithEntry[] | null,
  apiStore: ReturnType<typeof injectApiStore>,
) {
  if (!fokontanyDivisions) return "";
  return fokontanyDivisions.map((division, i) => {
    const admLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(division.admLevelCode)!;
    const toggleIsDisabled = !apiStore.initialAdmEntitiesAreLoaded;
    const tooltipText = division.isRendered ? "Remove from map" : "Show on map";
    const borderClassName = i === 0
      ? ""
      : "border-t border-t-solid border-t-base-content/30";
    return `
      <li class="${borderClassName} pt-1.5 pb-2">
        <div class="flex items-center justify-between gap-x-3">
          <div class="flex flex-col grow shrink basis-auto">
            <em class="not-italic text-[0.65rem] text-base-content/70 capitalize inline-block">
              ${admLevelTitle}:
            </em>
            <p class="grow shrink basis-auto truncate text-xs">
              ${division.text}
            </p>
          </div>
          <div>
            <div class="tooltip tooltip-left" data-tip="${tooltipText}">
              <input
                type="checkbox"
                ${toggleIsDisabled ? "disabled" : ""}
                ${division.isRendered ? "checked" : ""}
                data-level-code="${division.admLevelCode}"
                class="toggle toggle-xs toggle-${admLevelTitle}"
              />
            </div>
          </div>
        </div>
      </li>
    `;
  }).join("");
}

export default function useAddPinnedLocationMarkerPopup(
  pinnedLocationEntry: Signal<PinnedLocationEntry | null>,
  admTerritory: UseAddPinnedLocationMarkerPopupAdmTerritoryParams,
  options: UseAddPinnedLocationMarkerPopupOptions = {},
): UseAddPinnedLocationMarkerPopupResult {
  const { isCurrentLocation = false } = options;
  const { fokontanyDiscriminated, fokontanyDivisions } = admTerritory;

  const indexedDbConn = injectClientCacheIndexdDbConnection();
  const admGeoJsonClientCache = injectAdmGeojsonClientCache(indexedDbConn);
  const admGeoJsonStore = injectAdmGeojsonStore();
  const apiStore = injectApiStore();
  const provinceApi = injectProvinceApi();
  const regionApi = injectRegionApi();
  const districtApi = injectDistrictApi();
  const communeApi = injectCommuneApi();
  const fokontanyApi = injectFokontanyApi();
  const appMapStore = injectAppMapStore(
    admGeoJsonClientCache,
    admGeoJsonStore,
    apiStore,
    provinceApi,
    regionApi,
    districtApi,
    communeApi,
    fokontanyApi,
  );

  const wasCreated = useRef(false);

  const markerPopup = useSignal<maplibregl.Popup | null>(null);

  const loadingContainerRef = useRef<HTMLDivElement | null>(null);
  const errorContainerRef = useRef<HTMLDivElement | null>(null);
  const bodyLoadingContainerRef = useRef<HTMLDivElement | null>(null);
  const bodyErrorContainerRef = useRef<HTMLDivElement | null>(null);
  const bodyDivisionsContainerRef = useRef<HTMLUListElement | null>(null);
  const titleContainerRef = useRef<HTMLSpanElement | null>(null);
  const coordinatesFormattedContainerRef = useRef<HTMLParagraphElement | null>(
    null,
  );
  const outputFormatSelectRef = useRef<HTMLSelectElement | null>(null);

  const copyToClipboardTextResetterTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  useEffect(
    () => {
      const entry = pinnedLocationEntry.value;

      if (wasCreated.current || !entry) return;

      wasCreated.current = true;

      const targetLocationIconSVG = `
        <svg class="shrink-0 relative top-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" fill="currentColor" /><path fill-rule="evenodd" clip-rule="evenodd" d="M2.08296 7C2.50448 4.48749 4.48749 2.50448 7 2.08296V0H9V2.08296C11.5125 2.50448 13.4955 4.48749 13.917 7H16V9H13.917C13.4955 11.5125 11.5125 13.4955 9 13.917V16H7V13.917C4.48749 13.4955 2.50448 11.5125 2.08296 9H0V7H2.08296ZM4 8C4 5.79086 5.79086 4 8 4C10.2091 4 12 5.79086 12 8C12 10.2091 10.2091 12 8 12C5.79086 12 4 10.2091 4 8Z" fill="currentColor"/></svg>
      `;
      const markerIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin-icon lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
      `;
      const popupTitleIconSVG = isCurrentLocation
        ? targetLocationIconSVG
        : markerIconSVG;
      const popupTitle = isCurrentLocation ? "Current location" : entry.title;

      const markerPopupOutputFormatSelectOptionsHTML =
        GEOGRAPHIC_COORDINATE_OUTPUT_FORMAT_OPTIONS
          .map((option) => {
            const selectedAttributeHTML =
              option.value === GeographicCoordinateOutputFormat.DecimalDegrees
                ? "selected"
                : "";
            return `
              <option
                ${selectedAttributeHTML}
                value="${option.value}"
              >
                ${option.label}
              </option>
            `;
          })
          .join("");

      const coordinatesFormatted = formatGeographicCoordinates(
        entry.coordinates,
        GeographicCoordinateOutputFormat.DecimalDegrees,
      );

      const markerPopupCoordinatesFormattedDataAttrValue =
        entry.coordinates.lng + "," +
        entry.coordinates.lat;

      const copyIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy-icon lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
      `;
      const copiedIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-icon lucide-check text-success"><path d="M20 6 9 17l-5-5"/></svg>
      `;
      const checkIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy-check-icon lucide-copy-check text-success-content"><path d="m12 15 2 2 4-4"/><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
      `;

      const isLoadingFokontany = entry.isLoadingFokontany;
      const fokontanyErrorCause = entry.fokontanyErrorCause;

      let initialBodyLoadingHTML = "";
      let initialBodyLoadingClass = "hidden";
      if (!entry.fokontany && isLoadingFokontany) {
        initialBodyLoadingHTML = ADM_TERRITORY_BODY_LOADING_HTML;
        initialBodyLoadingClass = "contents";
      }

      let initialBodyErrorHTML = "";
      let initialBodyErrorClass = "hidden";
      if (fokontanyErrorCause) {
        initialBodyErrorHTML = getAdmTerritoryBodyErrorHTML(
          fokontanyErrorCause,
        );
        initialBodyErrorClass = "contents";
      }

      let initialDivisionsHTML = "";
      let initialDivisionsClass = "hidden";
      if (
        !(!entry.fokontany && isLoadingFokontany) && !fokontanyErrorCause &&
        fokontanyDivisions
      ) {
        initialDivisionsHTML = getFokontanyDivisionsHTML(
          fokontanyDivisions,
          apiStore,
        );
        initialDivisionsClass = "";
      }

      const markerPopupHTML = `
        <article class="w-[20rem] space-y-3.5">
          <div>
            <h5 class="flex items-start gap-x-1.5 text-sm font-bold text-base-content">
              ${popupTitleIconSVG}
              <span data-pinned-location-popup-title="${popupTitle}">${popupTitle}</span>
            </h5>
          </div>
          <div class="space-y-2">
            <fieldset class="fieldset">
              <label for="current-location-popup-output-format-${entry.id}" class="label">
                Output format
              </label>
              <div>
                <select
                  id="current-location-popup-output-format-${entry.id}"
                  data-current-location-popup-output-format
                  name="outputName"
                  class="select select-xs w-fit"
                >
                  ${markerPopupOutputFormatSelectOptionsHTML}
                </select>
              </div>
            </fieldset>
            <section aria-label="Coordinates">
              <div class="flex items-center gap-x-2 py-1">
                <div>
                  <h5
                    data-current-location-card-title
                    class="text-xs text-base-content/60 mb-1.25"
                  >
                    Coordinates
                  </h5>
                  <p data-coordinates-formatted="${markerPopupCoordinatesFormattedDataAttrValue}" class="text-xs text-base-content/90">
                    ${coordinatesFormatted ?? ""}
                  </p>
                </div>
                <div data-copy-to-clipboard-component="coordinates-formatted" class="tooltip">
                  <div class="tooltip-content">
                    <p class="text-xs">
                      Copy to clipboard
                    </p>
                  </div>
                  <button type="button" class="btn btn-sm btn-square">
                    ${copyIconSVG}
                  </button>
                </div>
              </div>
            </section>
          </div>
          <div data-collapse data-open="false" class="rounded-lg border border-base-content/20 bg-white">
            <button type="button" data-collapse-trigger aria-expanded="false"
                    class="cursor-pointer flex w-full items-center justify-between gap-4 px-3 py-3 text-left font-medium text-base-content transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-lg">
              <div class="flex items-center gap-x-3">
                <span
                  class="font-bold flex items-center gap-x-1.5"
                  style="font-size: 0.8125rem"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-landmark-icon lucide-landmark"><path d="M10 18v-7"/><path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/></svg>
                  ADM territory
                </span>
                <div data-adm-territory-loading-container class="contents">
                  ${isLoadingFokontany ? ADM_TERRITORY_LOADING_HTML : ""}
                </div>
                <div data-adm-territory-error-container class="contents">
                  ${fokontanyErrorCause ? ADM_TERRITORY_ERROR_HTML : ""}
                </div>
              </div>
              <svg data-collapse-icon viewBox="0 0 24 24" width="18" height="18" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round"
                   stroke-linejoin="round"
                   class="shrink-0 text-slate-500 transition-transform duration-300 ease-out">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div data-collapse-panel class="grid transition-[grid-template-rows] duration-300 ease-out" style="grid-template-rows: 0fr;">
              <div class="min-h-0 overflow-hidden">
                <div class="px-3 pb-4 pt-1">
                  <div data-adm-territory-body-loading-container class="${initialBodyLoadingClass}">
                    ${initialBodyLoadingHTML}
                  </div>
                  <div data-adm-territory-body-error-container class="${initialBodyErrorClass}">
                    ${initialBodyErrorHTML}
                  </div>
                  <ul data-adm-territory-divisions-container class="min-w-64 ${initialDivisionsClass}">
                    ${initialDivisionsHTML}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </article>
      `;
      const _markerPopup = new maplibregl.Popup({
        maxWidth: "none",
        offset: 15,
      })
        .setHTML(markerPopupHTML);
      markerPopup.value = _markerPopup;

      loadingContainerRef.current = _markerPopup._content.querySelector(
        "[data-adm-territory-loading-container]",
      ) as HTMLDivElement | null;
      errorContainerRef.current = _markerPopup._content.querySelector(
        "[data-adm-territory-error-container]",
      ) as HTMLDivElement | null;
      bodyLoadingContainerRef.current = _markerPopup._content.querySelector(
        "[data-adm-territory-body-loading-container]",
      ) as HTMLDivElement | null;
      bodyErrorContainerRef.current = _markerPopup._content.querySelector(
        "[data-adm-territory-body-error-container]",
      ) as HTMLDivElement | null;
      bodyDivisionsContainerRef.current = _markerPopup._content.querySelector(
        "[data-adm-territory-divisions-container]",
      ) as HTMLUListElement | null;
      titleContainerRef.current = _markerPopup._content.querySelector(
        "[data-pinned-location-popup-title]",
      ) as HTMLSpanElement | null;
      coordinatesFormattedContainerRef.current = _markerPopup._content
        .querySelector(
          "[data-coordinates-formatted]",
        ) as HTMLParagraphElement | null;
      outputFormatSelectRef.current = _markerPopup._content.querySelector(
        "[data-current-location-popup-output-format]",
      ) as HTMLSelectElement | null;

      const coordinatesFormattedElt = coordinatesFormattedContainerRef
        .current as HTMLParagraphElement;

      function getFormattedCoordinates(selectElt: HTMLSelectElement) {
        const format = selectElt.value as GeographicCoordinateOutputFormat;
        const coordinatesEncoded = coordinatesFormattedElt
          .dataset["coordinatesFormatted"] as string;
        const [lng, lat] = coordinatesEncoded.split(",")
          .map(Number) as [number, number];
        const coordinatesFormatted = formatGeographicCoordinates(
          { lng, lat },
          format,
        );
        return coordinatesFormatted;
      }

      const outputFormatSelectElt = outputFormatSelectRef
        .current as HTMLSelectElement;
      outputFormatSelectElt.addEventListener("change", (e) => {
        const coordinatesFormatted = getFormattedCoordinates(
          e.target as HTMLSelectElement,
        );
        coordinatesFormattedElt.innerHTML = coordinatesFormatted;
      });

      const copyToClipboardComponentElt = _markerPopup._content.querySelector(
        `[data-copy-to-clipboard-component="coordinates-formatted"]`,
      ) as HTMLDivElement;
      const copyToClipboardTextElt = copyToClipboardComponentElt.querySelector(
        ".tooltip-content p",
      ) as HTMLParagraphElement;
      const copyToClipboardBtnElt = copyToClipboardComponentElt.querySelector(
        "button",
      ) as HTMLButtonElement;

      copyToClipboardBtnElt.onclick = async () => {
        const coordinatesFormatted = getFormattedCoordinates(
          outputFormatSelectElt,
        );
        await navigator.clipboard.writeText(coordinatesFormatted);
        copyToClipboardTextElt.innerHTML = `
          <span class="flex items-center gap-x-1">
            ${copiedIconSVG}
            Copied!
          </span>
        `;
        copyToClipboardBtnElt.innerHTML = checkIconSVG;
        if (copyToClipboardTextResetterTimeoutRef.current) {
          clearTimeout(copyToClipboardTextResetterTimeoutRef.current);
        }
        copyToClipboardTextResetterTimeoutRef.current = setTimeout(() => {
          copyToClipboardTextElt.innerHTML = "Copy to clipboard";
          copyToClipboardBtnElt.innerHTML = copyIconSVG;
          copyToClipboardTextResetterTimeoutRef.current = null;
        }, 1500);
      };

      const collapseRoot = _markerPopup._content.querySelector(
        "[data-collapse]",
      ) as HTMLDivElement;
      if (collapseRoot) {
        const trigger = collapseRoot.querySelector(
          "[data-collapse-trigger]",
        ) as HTMLButtonElement;
        const panel = collapseRoot.querySelector(
          "[data-collapse-panel]",
        ) as HTMLDivElement;
        const icon = collapseRoot.querySelector(
          "[data-collapse-icon]",
        ) as SVGSVGElement;

        const setOpen = (open: boolean) => {
          collapseRoot.dataset.open = String(open);
          trigger.setAttribute("aria-expanded", String(open));
          panel.style.gridTemplateRows = open ? "1fr" : "0fr";
          if (icon) {
            icon.style.transform = open ? "rotate(180deg)" : "rotate(0deg)";
          }
        };

        trigger.addEventListener("click", () => {
          setOpen(collapseRoot.dataset.open !== "true");
        });

        setOpen(collapseRoot.dataset.open === "true");
      }
    },
    [pinnedLocationEntry.value],
  );

  function popupCleanup() {
    markerPopup.value?.remove();
    markerPopup.value = null;
    wasCreated.current = false;
    if (copyToClipboardTextResetterTimeoutRef.current) {
      clearTimeout(copyToClipboardTextResetterTimeoutRef.current);
    }
  }

  useEffect(() => {
    if (!pinnedLocationEntry.value) {
      popupCleanup();
    }
  }, [pinnedLocationEntry.value?.id]);

  useEffect(() => popupCleanup, []);

  useEffect(() => {
    if (!markerPopup.value) return;
    const loadingContainer = loadingContainerRef.current;
    if (!loadingContainer) return;

    if (pinnedLocationEntry.value?.isLoadingFokontany) {
      loadingContainer.innerHTML = ADM_TERRITORY_LOADING_HTML;
    } else {
      loadingContainer.innerHTML = "";
    }
  }, [pinnedLocationEntry.value?.isLoadingFokontany, markerPopup.value]);

  useEffect(() => {
    if (!markerPopup.value) return;
    const errorContainer = errorContainerRef.current;
    if (!errorContainer) return;

    if (pinnedLocationEntry.value?.fokontanyErrorCause) {
      errorContainer.innerHTML = ADM_TERRITORY_ERROR_HTML;
    } else {
      errorContainer.innerHTML = "";
    }
  }, [pinnedLocationEntry.value?.fokontanyErrorCause, markerPopup.value]);

  useEffect(() => {
    if (!markerPopup.value) return;
    const bodyLoadingContainer = bodyLoadingContainerRef.current;
    if (!bodyLoadingContainer) return;

    if (
      !pinnedLocationEntry.value?.fokontany &&
      pinnedLocationEntry.value?.isLoadingFokontany
    ) {
      bodyLoadingContainer.innerHTML = ADM_TERRITORY_BODY_LOADING_HTML;
      bodyLoadingContainer.classList.remove("hidden");
      bodyLoadingContainer.classList.add("contents");
    } else {
      bodyLoadingContainer.innerHTML = "";
      bodyLoadingContainer.classList.remove("contents");
      bodyLoadingContainer.classList.add("hidden");
    }
  }, [
    pinnedLocationEntry.value?.isLoadingFokontany,
    pinnedLocationEntry.value?.fokontany,
    markerPopup.value,
  ]);

  useEffect(() => {
    if (!markerPopup.value) return;
    const bodyErrorContainer = bodyErrorContainerRef.current;
    if (!bodyErrorContainer) return;

    if (pinnedLocationEntry.value?.fokontanyErrorCause) {
      bodyErrorContainer.innerHTML = getAdmTerritoryBodyErrorHTML(
        pinnedLocationEntry.value.fokontanyErrorCause,
      );
      bodyErrorContainer.classList.remove("hidden");
      bodyErrorContainer.classList.add("contents");
    } else {
      bodyErrorContainer.innerHTML = "";
      bodyErrorContainer.classList.remove("contents");
      bodyErrorContainer.classList.add("hidden");
    }
  }, [pinnedLocationEntry.value?.fokontanyErrorCause, markerPopup.value]);

  async function handleToggleClick(e: Event) {
    e.preventDefault();
    const target = e.target as HTMLInputElement;
    const levelCode = target.dataset["levelCode"] as AdmLevelCode;
    const isChecked = target.checked;
    await appMapStore.toggleAdmEntityGeoJsonEntryOnMap(
      fokontanyDiscriminated!,
      levelCode,
      isChecked,
    );
  }

  useEffect(() => {
    if (!markerPopup.value) return;
    const bodyDivisionsContainer = bodyDivisionsContainerRef.current;
    if (!bodyDivisionsContainer) return;

    const isLoading = !pinnedLocationEntry.value?.fokontany &&
      pinnedLocationEntry.value?.isLoadingFokontany;
    const isError = !!pinnedLocationEntry.value?.fokontanyErrorCause;
    if (isError || isLoading) {
      bodyDivisionsContainer.innerHTML = "";
      bodyDivisionsContainer.classList.add("hidden");
    } else if (fokontanyDivisions) {
      bodyDivisionsContainer.innerHTML = getFokontanyDivisionsHTML(
        fokontanyDivisions,
        apiStore,
      );
      bodyDivisionsContainer.classList.remove("hidden");
      const togglesElts = bodyDivisionsContainer.querySelectorAll(
        `input[data-level-code]`,
      );
      for (const toggleElt of togglesElts) {
        toggleElt.addEventListener("click", handleToggleClick);
      }
    }
  }, [
    pinnedLocationEntry.value?.isLoadingFokontany,
    pinnedLocationEntry.value?.fokontany,
    pinnedLocationEntry.value?.fokontanyErrorCause,
    fokontanyDivisions,
    markerPopup.value,
  ]);

  useEffect(() => {
    if (!markerPopup.value || isCurrentLocation) return;
    const titleElt = titleContainerRef.current;
    if (!titleElt || !pinnedLocationEntry.value) return;

    const title = pinnedLocationEntry.value.title;
    titleElt.dataset["pinnedLocationPopupTitle"] = title;
    titleElt.innerHTML = title;
  }, [pinnedLocationEntry.value?.title, markerPopup.value, isCurrentLocation]);

  useEffect(() => {
    if (!markerPopup.value) return;
    const coordinatesFormattedElt = coordinatesFormattedContainerRef.current;
    if (!coordinatesFormattedElt || !pinnedLocationEntry.value) return;

    const entry = pinnedLocationEntry.value;
    const markerPopupCoordinatesFormattedDataAttrValue = entry.coordinates.lng +
      "," + entry.coordinates.lat;

    const outputFormatSelectElt = outputFormatSelectRef.current;
    const format = outputFormatSelectElt
      ? (outputFormatSelectElt.value as GeographicCoordinateOutputFormat)
      : GeographicCoordinateOutputFormat.DecimalDegrees;

    const coordinatesFormatted = formatGeographicCoordinates(
      entry.coordinates,
      format,
    );

    coordinatesFormattedElt.dataset["coordinatesFormatted"] =
      markerPopupCoordinatesFormattedDataAttrValue;
    coordinatesFormattedElt.innerHTML = coordinatesFormatted ?? "";
  }, [pinnedLocationEntry.value?.coordinates, markerPopup.value]);

  useEffect(() => {
    if (!markerPopup.value || !fokontanyDivisions) return;
    for (const division of fokontanyDivisions) {
      const input = markerPopup.value._content?.querySelector(
        `[data-level-code="${division.admLevelCode}"]`,
      ) as HTMLInputElement | null;
      if (input) {
        if (division.isLoading) {
          input.indeterminate = true;
        } else {
          input.indeterminate = false;
          input.checked = division.isRendered;
        }

        const toggleTooltipElt = input.parentElement!;
        const toggleTooltipText = division.isRendered
          ? "Remove from map"
          : "Show on map";
        toggleTooltipElt.setAttribute("data-tip", toggleTooltipText);
      }
    }
  }, [fokontanyDivisions, markerPopup.value]);

  return {
    markerPopup,
  };
}
