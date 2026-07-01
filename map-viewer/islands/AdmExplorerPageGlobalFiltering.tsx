import { useEffect, useRef } from "preact/hooks";
import { useComputed, useSignal, useSignalEffect } from "@preact/signals";
import {
  ADM_LEVEL_CODES_INDEXED,
  ADM_LEVEL_INDEX_BY_CODE,
  ADM_LEVEL_TITLE_BY_CODE,
  AdmLevelCode,
} from "@scope/consts/models";
import AdmEntitiesSearchComboBoxField, {
  SelectedAdmEntityValue,
} from "@/islands/AdmEntitiesSearchComboBoxField.tsx";
import { AdmEntity } from "@scope/types/models";
import { injectApiStore } from "@/stores/api.store.ts";
import { getAdmEntityValue } from "@/helpers/adm-entity.helper.ts";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback.ts";
import {
  ADM_ENTITIES_SEARCH_DEBOUNCE_DELAY,
  ADM_ENTITIES_SEARCH_MIN_LENGTH,
} from "@/config/adm-entities.config.ts";
import {
  GetAdmEntitiesInUnionRequestParams,
  injectAdmEntityApi,
} from "@/api/adm-entity.api.ts";
import { ApiCallPaginationParams } from "@/types/api.d.ts";
import { ADM_ENTITIES_COUNT } from "@/config/adm-entities.config.ts";

export default function AdmExplorerPageGlobalFiltering() {
  const startingAdmLevelCode = useSignal<AdmLevelCode>(
    AdmLevelCode.PROVINCE,
  );

  function handleStartingAdmLevelCodeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    startingAdmLevelCode.value = target.value as AdmLevelCode;
  }

  const apiStore = injectApiStore();

  const initialAdmEntities = useComputed(() => {
    if (!apiStore.config.value || !apiStore.initialAdmEntitiesAreLoaded.value) {
      return [];
    }
    const entities: AdmEntity[] = [];
    for (const province of apiStore.provinces.value) {
      if (!apiStore.config.value.hasGeojson) {
        province.admLevel = ADM_LEVEL_INDEX_BY_CODE.get(AdmLevelCode.PROVINCE)!;
      }
      entities.push(province);
    }
    for (const region of apiStore.regions.value) {
      if (!apiStore.config.value.hasGeojson) {
        region.admLevel = ADM_LEVEL_INDEX_BY_CODE.get(AdmLevelCode.REGION)!;
      }
      entities.push(region);
    }
    for (const commune of apiStore.communes.value) {
      if (!apiStore.config.value.hasGeojson) {
        commune.admLevel = ADM_LEVEL_INDEX_BY_CODE.get(AdmLevelCode.COMMUNE)!;
      }
      entities.push(commune);
    }
    for (const fokontany of apiStore.fokontanys.value) {
      if (!apiStore.config.value.hasGeojson) {
        fokontany.admLevel = ADM_LEVEL_INDEX_BY_CODE.get(
          AdmLevelCode.FOKONTANY,
        )!;
      }
      entities.push(fokontany);
    }
    return entities;
  });

  const searchValue = useSignal("");
  const selectedAdmEntityValue = useSignal<SelectedAdmEntityValue | null>(null);

  const apiAdmEntitiesAreLoaded = useSignal(false);
  const apiAdmEntitiesAreLoading = useSignal(false);
  const apiAdmEntities = useSignal<AdmEntity[]>([]);
  const apiAdmEntitiesNextCursor = useSignal<string | null>(null);
  const isLoadingMoreApiAdmEntities = useComputed(() => {
    return apiAdmEntitiesAreLoaded.value && apiAdmEntitiesAreLoading.value;
  });

  const admEntityApi = injectAdmEntityApi();

  const apiCallAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    apiCallAbortControllerRef.current?.abort();
  }, []);

  const debouncedHandleSearchValueChange = useDebouncedCallback<
    [ApiCallPaginationParams, GetAdmEntitiesInUnionRequestParams, boolean]
  >(
    async (paginationParams, queryParams, isFresh) => {
      try {
        apiCallAbortControllerRef.current?.abort();
        apiCallAbortControllerRef.current = new AbortController();
        isFresh && (apiAdmEntitiesAreLoaded.value = false);
        apiAdmEntitiesAreLoading.value = true;
        const paginatedAdmEntities = await admEntityApi.getAllInUnionPaginated(
          paginationParams,
          queryParams,
          {
            signal: apiCallAbortControllerRef.current.signal,
          },
        );
        apiAdmEntities.value = isFresh
          ? paginatedAdmEntities.records
          : [...apiAdmEntities.value, ...paginatedAdmEntities.records];
        apiAdmEntitiesNextCursor.value = paginatedAdmEntities.nextEncoded ??
          null;
        apiAdmEntitiesAreLoaded.value = true;
      } catch (e) {
        console.error(e);
      } finally {
        apiAdmEntitiesAreLoading.value = false;
      }
    },
    ADM_ENTITIES_SEARCH_DEBOUNCE_DELAY,
  );

  const admEntities = useComputed<AdmEntity[]>(() => {
    if (searchValue.value.length < ADM_ENTITIES_SEARCH_MIN_LENGTH) {
      return initialAdmEntities.value
        .filter((entity) => {
          if (
            entity.admLevel! <
              ADM_LEVEL_INDEX_BY_CODE.get(startingAdmLevelCode.value)!
          ) {
            return false;
          }
          const value = getAdmEntityValue(entity);
          return value.toLocaleLowerCase("fr").startsWith(
            searchValue.value.toLocaleLowerCase("fr"),
          );
        });
    }
    return apiAdmEntities.value;
  });

  useSignalEffect(() => {
    const search = searchValue.value;
    if (search.length >= ADM_ENTITIES_SEARCH_MIN_LENGTH) {
      debouncedHandleSearchValueChange(
        { limit: ADM_ENTITIES_COUNT.GLOBAL_MODE },
        {
          from: startingAdmLevelCode.value,
          search,
        },
        true,
      );
    }
  });

  function handleComboboxScrollEnd() {
    const search = searchValue.value;
    if (
      search.length >= ADM_ENTITIES_SEARCH_MIN_LENGTH &&
      apiAdmEntitiesAreLoaded.value && apiAdmEntitiesNextCursor.value &&
      !apiAdmEntitiesAreLoading.value
    ) {
      const paginationParams: ApiCallPaginationParams = {
        limit: ADM_ENTITIES_COUNT.GLOBAL_MODE,
      };
      apiAdmEntitiesNextCursor.value &&
        (paginationParams.cursor = apiAdmEntitiesNextCursor.value);
      debouncedHandleSearchValueChange(
        paginationParams,
        {
          from: startingAdmLevelCode.value,
          search,
        },
        false,
      );
    }
  }

  const searchFieldPlaceholder = useComputed<string>(() => {
    if (startingAdmLevelCode.value === AdmLevelCode.FOKONTANY) {
      return "Type any fokontany";
    }
    const startingLevel = ADM_LEVEL_TITLE_BY_CODE.get(
      startingAdmLevelCode.value,
    )!;
    return `From any ${startingLevel} to any fokontany`;
  });

  return (
    <section>
      <form class="space-y-3 pb-4">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            Start from an administrative level
          </legend>
          <select
            value={startingAdmLevelCode.value}
            class="select select-bordered capitalize w-full"
            onChange={handleStartingAdmLevelCodeChange}
          >
            {ADM_LEVEL_CODES_INDEXED.map((admLevelCode) => (
              <option
                key={admLevelCode}
                value={admLevelCode}
                class="capitalize"
              >
                {ADM_LEVEL_TITLE_BY_CODE.get(admLevelCode)!}s
              </option>
            ))}
          </select>
        </fieldset>
        <AdmEntitiesSearchComboBoxField
          legend="Search for a territory"
          placeholder={searchFieldPlaceholder.value}
          entities={admEntities.value}
          inputValue={searchValue.value}
          selectedAdmEntityValue={selectedAdmEntityValue.value}
          selectedWithParents
          isLoadingMore={isLoadingMoreApiAdmEntities.value}
          onInputChange={(value) => searchValue.value = value}
          onSelected={(value) => selectedAdmEntityValue.value = value}
          onSelectedClose={() => selectedAdmEntityValue.value = null}
          onScrollEnd={handleComboboxScrollEnd}
        />
      </form>
    </section>
  );
}
