import { TargetedMouseEvent } from "preact";
import { useEffect, useMemo, useRef } from "preact/hooks";
import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import type { SelectedAdmEntityValue } from "./AdmEntitiesSearchComboBoxFieldListItem.tsx";
import AdmPill from "@/islands/AdmPill.tsx";
import {
  getAdmEntityValue,
  getCommuneNameEncoding,
  getFokontanyNameEncoding,
} from "@/helpers/adm-entity.helper.ts";
import {
  AdmEntityDivisionWithEntry,
  AppMapAdmEntityGeoJsonEntry,
  injectAppMapStore,
} from "@/stores/app-map.store.ts";
import { injectAdmGeojsonClientCache } from "@/client-cache/adm-geojson.client-cache.ts";
import { injectClientCacheIndexdDbConnection } from "@/client-cache/client-cache.indexeddb.ts";
import { injectAdmGeojsonStore } from "@/stores/adm-geojson.store.ts";
import { injectProvinceApi } from "@/api/province.api.ts";
import { injectRegionApi } from "@/api/region.api.ts";
import { injectDistrictApi } from "@/api/district.api.ts";
import { injectCommuneApi } from "@/api/commune.api.ts";
import { injectFokontanyApi } from "@/api/fokontany.api.ts";
import { injectApiStore } from "@/stores/api.store.ts";
import SelectedAdmEntityItemParentItem from "@/islands/SelectedAdmEntityItemParentItem.tsx";

export type SelectedAdmEntityItemProps = {
  value: SelectedAdmEntityValue;
  withParents?: boolean;
  unNestParents?: boolean;
  onClose?: (value: SelectedAdmEntityValue) => void;
};

export default function SelectedAdmEntityItem(
  {
    value,
    withParents = false,
    unNestParents = false,
    onClose,
  }: SelectedAdmEntityItemProps,
) {
  const admLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(value.admLevelCode)!;

  function getToggleClassName(admLevelCode: AdmLevelCode) {
    switch (admLevelCode) {
      case AdmLevelCode.PROVINCE:
        return "toggle-province";
      case AdmLevelCode.REGION:
        return "toggle-region";
      case AdmLevelCode.DISTRICT:
        return "toggle-district";
      case AdmLevelCode.COMMUNE:
        return "toggle-commune";
      case AdmLevelCode.FOKONTANY:
        return "toggle-fokontany";
      default:
        throw new Error(
          `Unsupported admLevelCode ${admLevelCode satisfies never} for toggle class`,
        );
    }
  }

  const toggleClassName = useMemo<string>(() => {
    return getToggleClassName(value.admLevelCode);
  }, [value.admLevelCode]);

  const provinceApi = injectProvinceApi();
  const regionApi = injectRegionApi();
  const districtApi = injectDistrictApi();
  const communeApi = injectCommuneApi();
  const fokontanyApi = injectFokontanyApi();

  const apiStore = injectApiStore();

  const indexedDb = injectClientCacheIndexdDbConnection();
  const admGeoJsonClientCache = injectAdmGeojsonClientCache(indexedDb);
  const admGeoJsonStore = injectAdmGeojsonStore();
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

  function getAdmEntityEntryName(value: SelectedAdmEntityValue) {
    const admLevelCode = value.admLevelCode;
    return admLevelCode === AdmLevelCode.COMMUNE
      ? getCommuneNameEncoding(value.entity)
      : admLevelCode === AdmLevelCode.FOKONTANY
      ? getFokontanyNameEncoding(value.entity)
      : getAdmEntityValue(value.entity, value.admLevelCode);
  }

  const geojsonEntry = useMemo<AppMapAdmEntityGeoJsonEntry | null>(
    () => {
      const admLevelCode = value.admLevelCode;
      const entryName = getAdmEntityEntryName(value);
      return appMapStore
        .getAdmEntityEntryByNameMapByLevel(admLevelCode)
        .get(entryName) ?? null;
    },
    [
      value,
      appMapStore.provinceGeoJsonEntryByName.value,
      appMapStore.regionGeoJsonEntryByName.value,
      appMapStore.districtGeoJsonEntryByName.value,
      appMapStore.communeGeoJsonEntryByName.value,
      appMapStore.fokontanyGeoJsonEntryByName.value,
    ],
  );

  useEffect(
    () => {
      const _geojsonEntry = geojsonEntry;
      if (_geojsonEntry && _geojsonEntry.admEntityDiscriminated) {
        appMapStore.referenceAdmEntityGeoJsonEntryByName(
          _geojsonEntry.admEntityDiscriminated.admLevelCode,
          _geojsonEntry.name,
        );
        return () => {
          const updatedGeoJsonEntry = appMapStore
            .referenceAdmEntityGeoJsonEntryByName(
              _geojsonEntry.admEntityDiscriminated?.admLevelCode!,
              _geojsonEntry.name,
              false,
            );
          if (updatedGeoJsonEntry?.refsCount === 0) {
            appMapStore.renderAdmEntityGeoJsonEntryByName(
              updatedGeoJsonEntry.admEntityDiscriminated!.admLevelCode,
              updatedGeoJsonEntry.name,
              false,
            );
          }
        };
      }
    },
    [
      geojsonEntry?.admEntityDiscriminated?.admLevelCode,
      geojsonEntry?.admEntityDiscriminated?.entity.id,
    ],
  );

  const parentsValues = useMemo<AdmEntityDivisionWithEntry[]>(
    () => {
      return appMapStore.breakAdmAttributesDiscriminatedDivisionsWithEntry(
        value,
        false,
      );
    },
    [
      value,
      appMapStore.provinceGeoJsonEntryByName.value,
      appMapStore.regionGeoJsonEntryByName.value,
      appMapStore.districtGeoJsonEntryByName.value,
      appMapStore.communeGeoJsonEntryByName.value,
    ],
  );

  const hideShowOnMapToggle = !apiStore.config.value?.hasGeojson;

  const toggleIsDisabled = !apiStore.initialAdmEntitiesAreLoaded;

  async function toggleShowOnMap(admLevelCode: AdmLevelCode, toggle: boolean) {
    await appMapStore.toggleAdmEntityGeoJsonEntryOnMap(
      value,
      admLevelCode,
      toggle,
    );
  }

  async function handleToggleChange(
    e: TargetedMouseEvent<HTMLInputElement>,
    admLevelCode: AdmLevelCode,
  ) {
    e.preventDefault();
    if (!geojsonEntry?.isLoading) {
      await toggleShowOnMap(
        admLevelCode,
        e.currentTarget.checked,
      );
    }
  }

  const toggleInputElementRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (toggleInputElementRef.current) {
      if (geojsonEntry?.isLoading) {
        toggleInputElementRef.current.indeterminate = true;
      } else if (typeof geojsonEntry?.isRendered === "boolean") {
        toggleInputElementRef.current.indeterminate = false;
        toggleInputElementRef.current.checked = geojsonEntry?.isRendered;
      }
    }
  }, [geojsonEntry?.isRendered, geojsonEntry?.isLoading]);

  async function handlePillClick(admLevelCode?: AdmLevelCode) {
    await appMapStore.toggleAdmEntityGeoJsonEntryOnMap(
      value,
      admLevelCode ?? value.admLevelCode,
      true,
      true,
    );
  }

  return (
    <ul>
      <li class="py-1 bg-white relative z-10">
        <em class="not-italic text-xs text-base-content/70 capitalize inline-block mb-1">
          {admLevelTitle}:
        </em>
        <div class="flex justify-between gap-x-3">
          <div class="grow shrink basis-auto truncate">
            <AdmPill
              admLevelCode={value.admLevelCode}
              text={getAdmEntityValue(value.entity, value.admLevelCode)}
              closable
              value={value}
              onClick={() => handlePillClick()}
              onClose={() => onClose?.(value)}
            />
          </div>
          {!hideShowOnMapToggle && (
            <div class="flex items-center">
              <div
                class="tooltip tooltip-left"
                data-tip={geojsonEntry?.isRendered
                  ? "Remove from map"
                  : "Show on map"}
              >
                <input
                  ref={toggleInputElementRef}
                  type="checkbox"
                  disabled={toggleIsDisabled}
                  checked={geojsonEntry?.isRendered ?? false}
                  class={`toggle ${toggleClassName}`}
                  onClick={(e) => handleToggleChange(e, value.admLevelCode)}
                />
              </div>
            </div>
          )}
        </div>
      </li>
      {withParents && parentsValues.length > 0 && (
        <li>
          <ul class={!unNestParents ? "pl-5" : "pl-0"}>
            {parentsValues.map((parentValue) => {
              const toggleIsDisabled = !apiStore.initialAdmEntitiesAreLoaded;
              const toggleClassName = getToggleClassName(
                parentValue.admLevelCode,
              );
              return (
                <li
                  key={parentValue.admLevelCode}
                  class="relative"
                >
                  <SelectedAdmEntityItemParentItem
                    value={value}
                    hideShowOnMapToggle={hideShowOnMapToggle}
                    toggleClassName={toggleClassName}
                    parentValue={parentValue}
                    toggleIsDisabled={toggleIsDisabled}
                    onClick={handlePillClick}
                    onToggleChange={toggleShowOnMap}
                  />
                  {!unNestParents && (
                    <div class="absolute bottom-0 left-0 w-1/2 h-[calc(100%+0.5rem)] border-l border-l-base-content/30 border-l-solid border-b border-b-base-content/30 border-b-solid rounded-b-lg -translate-x-5 -translate-y-1/2">
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </li>
      )}
    </ul>
  );
}
