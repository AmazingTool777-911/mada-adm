import { computed, signal } from "@preact/signals";
import {
  Commune,
  District,
  Fokontany,
  MadaAdmConfig,
  Province,
  Region,
} from "@scope/types/models";

export class ApiStore {
  readonly config = signal<MadaAdmConfig | null>(null);

  readonly initialAdmEntitiesAreLoaded = signal(false);

  readonly provinces = signal<Province[]>([]);
  readonly provinceByName = computed(() => {
    return new Map(this.provinces.value.map((p) => [p.province, p]));
  });

  readonly regions = signal<Region[]>([]);
  readonly regionByName = computed(() => {
    return new Map(this.regions.value.map((p) => [p.region, p]));
  });

  readonly districtsAreLoaded = signal(false);
  readonly districtsCursor = signal<string | null>(null);
  readonly districts = signal<District[]>([]);

  readonly communesAreLoaded = signal(false);
  readonly communesCursor = signal<string | null>(null);
  readonly communes = signal<Commune[]>([]);

  readonly fokontanysAreLoaded = signal(false);
  readonly fokontanysCursor = signal<string | null>(null);
  readonly fokontanys = signal<Fokontany[]>([]);
}

let instance: ApiStore | null = null;

export function injectApiStore(): ApiStore {
  return (instance ??= new ApiStore());
}
