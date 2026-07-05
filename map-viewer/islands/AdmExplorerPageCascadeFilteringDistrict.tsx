import { useEffect, useMemo, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import {
  AdmEntityDiscriminated,
  District,
  Province,
  Region,
} from "@scope/types/models";
import { AdmLevelCode } from "@scope/consts/models";
import AdmEntitiesSearchComboBoxField from "@/islands/AdmEntitiesSearchComboBoxField.tsx";
import { injectApiStore } from "@/stores/api.store.ts";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback.ts";
import { ApiCallPaginationParams } from "@/types/api.d.ts";
import {
  GetDistrictsPaginatedRequestParams,
  injectDistrictApi,
} from "@/api/district.api.ts";
import {
  ADM_ENTITIES_COUNT,
  ADM_ENTITIES_SEARCH_DEBOUNCE_DELAY,
} from "@/config/adm-entities.config.ts";

export type AdmExplorerPageCascadeFilteringDistrictProps = {
  selectedProvince: Province | null;
  selectedRegion: Region | null;
  selectedDistrict: District | null;
  onSelectedChange?: (province: District | null) => void;
};

export default function AdmExplorerPageCascadeFilteringDistrict({
  selectedProvince,
  selectedRegion,
  selectedDistrict,
  onSelectedChange,
}: AdmExplorerPageCascadeFilteringDistrictProps) {
  const selectedDistrictDiscriminated = useMemo<AdmEntityDiscriminated | null>(
    () => {
      return selectedDistrict
        ? {
          admLevelCode: AdmLevelCode.DISTRICT,
          entity: selectedDistrict,
        }
        : null;
    },
    [selectedDistrict],
  );

  function handleSelectedChange(value: AdmEntityDiscriminated) {
    if (value.admLevelCode === AdmLevelCode.DISTRICT) {
      onSelectedChange?.(value.entity);
    }
  }

  const apiStore = injectApiStore();

  const search = useSignal("");
  const directSearch = useSignal("");

  const apiDistricts = useSignal<District[]>([]);
  const apiDistrictsNextCursor = useSignal<string | null>(null);
  const apiDistrictsAreLoading = useSignal(false);
  const apiDistrictsAreLoaded = useSignal(false);

  const districtApi = injectDistrictApi();

  const apiCallAbortControllerRef = useRef<AbortController | null>(null);

  const fetchDistrictsDebouncedCb = useDebouncedCallback<
    [
      ApiCallPaginationParams,
      GetDistrictsPaginatedRequestParams,
      boolean,
    ]
  >(
    async (paginationParams, queryParams, isFirstLoad) => {
      try {
        if (isFirstLoad && queryParams.search) {
          apiDistrictsAreLoaded.value = false;
        }
        apiDistrictsAreLoading.value = true;
        apiCallAbortControllerRef.current?.abort();
        apiCallAbortControllerRef.current = new AbortController();
        const paginatedDistricts = await districtApi.getManyPaginated(
          paginationParams,
          queryParams,
          { signal: apiCallAbortControllerRef.current.signal },
        );
        if (queryParams.search) {
          apiDistricts.value = isFirstLoad
            ? paginatedDistricts.records
            : [...apiDistricts.value, ...paginatedDistricts.records];
          apiDistrictsNextCursor.value = paginatedDistricts.nextEncoded ?? null;
          apiDistrictsAreLoaded.value = true;
        } else {
          apiStore.districts.value = [
            ...apiStore.districts.value,
            ...paginatedDistricts.records,
          ];
          apiStore.districtsNextCursor.value = paginatedDistricts.nextEncoded ??
            null;
        }
      } catch (error) {
        console.error(error);
      } finally {
        apiDistrictsAreLoading.value = false;
      }
    },
    ADM_ENTITIES_SEARCH_DEBOUNCE_DELAY,
  );

  const disabledReason = useMemo<string | null>(() => {
    const config = apiStore.config.value;
    if (selectedProvince && config) {
      if (!config.isProvinceFkRepeated) {
        return "The province id foreign key is not supported by the districts based on the database configuration.";
      }
    }
    return null;
  }, [apiStore.config.value, selectedProvince]);

  useEffect(() => {
    if (disabledReason || !search.value) return;
    fetchDistrictsDebouncedCb(
      { limit: ADM_ENTITIES_COUNT.CASCADE_MODE },
      {
        search: search.value,
        provinceId: selectedProvince?.id,
        regionId: selectedRegion?.id,
      },
      true,
    );
  }, [disabledReason, search.value]);

  async function handleScrollEnd() {
    if (disabledReason) return;
    if (
      search.value && apiDistrictsAreLoaded.value &&
      !apiDistrictsNextCursor.value
    ) return;
    if (
      !search.value && apiStore.districtsAreLoaded.value &&
      !apiStore.districtsNextCursor.value
    ) return;
    const paginationParams: ApiCallPaginationParams = {
      limit: ADM_ENTITIES_COUNT.CASCADE_MODE,
    };
    const nextCursor = search.value
      ? apiDistrictsNextCursor.value
      : apiStore.districtsNextCursor.value;
    if (nextCursor) {
      paginationParams.cursor = nextCursor;
    }
    await fetchDistrictsDebouncedCb(
      paginationParams,
      {
        search: search.value,
        provinceId: selectedProvince?.id,
        regionId: selectedRegion?.id,
      },
      false,
    );
  }

  useEffect(() => {
    return () => {
      apiCallAbortControllerRef.current?.abort();
      fetchDistrictsDebouncedCb.cancel();
    };
  }, []);

  const districts = useMemo(
    () => {
      if (search.value) {
        return apiDistricts.value;
      }
      if (selectedRegion) {
        return apiStore.districts.value.filter((d) => {
          return d.regionId === selectedRegion.id;
        });
      }
      if (selectedProvince && apiStore.config.value?.isProvinceFkRepeated) {
        return apiStore.districts.value.filter((d) => {
          return d.provinceId! === selectedProvince.id;
        });
      }
      return apiStore.districts.value;
    },
    [
      apiStore.config.value,
      search.value,
      apiDistricts.value,
      apiStore.districts.value,
    ],
  );

  function clearSearch() {
    onSelectedChange?.(null);
    search.value = "";
    directSearch.value = "";
  }

  useEffect(() => {
    if (selectedProvince) {
      clearSearch();
    }
  }, [selectedProvince]);

  useEffect(() => {
    clearSearch();
  }, [selectedRegion]);

  let placeholder = "Any district";
  if (selectedRegion) {
    placeholder += ` in "${selectedRegion.region}" region`;
  } else if (selectedProvince) {
    placeholder += ` in "${selectedProvince.province}" province`;
  }

  const isLoadingMore = apiDistrictsAreLoaded.value &&
    apiDistrictsAreLoading.value;

  return (
    <AdmEntitiesSearchComboBoxField
      admLevelCode={AdmLevelCode.DISTRICT}
      entities={districts}
      inputValue={search.value}
      inputDirectValue={directSearch}
      legend="Search for districts"
      placeholder={placeholder}
      selectedAdmEntityValue={selectedDistrictDiscriminated}
      isLoadingMore={isLoadingMore}
      disabled={!!disabledReason}
      inputTooltipText={disabledReason}
      onInputChange={(v) => search.value = v}
      onSelected={handleSelectedChange}
      onSelectedClose={() => onSelectedChange?.(null)}
      onScrollEnd={handleScrollEnd}
    />
  );
}
