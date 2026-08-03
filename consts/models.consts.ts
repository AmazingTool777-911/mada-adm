/**
 * The names of the provinces in Madagascar.
 */
export enum ProvinceName {
  ANTANANARIVO = "Antananarivo",
  ANTSIRANANA = "Antsiranana",
  FIANARANTSOA = "Fianarantsoa",
  MAHAJANGA = "Mahajanga",
  TOAMASINA = "Toamasina",
  TOLIARA = "Toliara",
}

/**
 * The administrative level codes used in the Madagascar ADM hierarchy.
 */
export enum AdmLevelCode {
  /** Top-level administrative division. */
  PROVINCE = "ADM0",
  /** Second-level administrative division. */
  REGION = "ADM1",
  /** Third-level administrative division. */
  DISTRICT = "ADM2",
  /** Fourth-level administrative division. */
  COMMUNE = "ADM3",
  /** Fifth-level administrative division. */
  FOKONTANY = "ADM4",
}

/**
 * A mapping of administrative level codes to their human-readable titles.
 */
export const ADM_LEVEL_TITLE_BY_CODE: Map<AdmLevelCode, string> = new Map([
  [AdmLevelCode.PROVINCE, "province"],
  [AdmLevelCode.REGION, "region"],
  [AdmLevelCode.DISTRICT, "district"],
  [AdmLevelCode.COMMUNE, "commune"],
  [AdmLevelCode.FOKONTANY, "fokontany"],
]);

/**
 * A mapping of human-readable administrative level titles to their corresponding codes.
 */
export const ADM_LEVEL_CODE_BY_TITLE: Map<string, AdmLevelCode> = new Map([
  ["province", AdmLevelCode.PROVINCE],
  ["region", AdmLevelCode.REGION],
  ["district", AdmLevelCode.DISTRICT],
  ["commune", AdmLevelCode.COMMUNE],
  ["fokontany", AdmLevelCode.FOKONTANY],
]);

/**
 * The ordered list of administrative level codes, from province to fokontany.
 */
export const ADM_LEVEL_CODES_INDEXED: AdmLevelCode[] = [
  AdmLevelCode.PROVINCE,
  AdmLevelCode.REGION,
  AdmLevelCode.DISTRICT,
  AdmLevelCode.COMMUNE,
  AdmLevelCode.FOKONTANY,
];

/**
 * A mapping of administrative level codes to their index in the hierarchy.
 */
export const ADM_LEVEL_INDEX_BY_CODE: Map<AdmLevelCode, number> = new Map([
  [AdmLevelCode.PROVINCE, 0],
  [AdmLevelCode.REGION, 1],
  [AdmLevelCode.DISTRICT, 2],
  [AdmLevelCode.COMMUNE, 3],
  [AdmLevelCode.FOKONTANY, 4],
]);

/**
 * The paths to the NDJSON files for each administrative level, indexed by level index (0-4).
 */
export const ADM_GEOJSON_FILES_PATHS: string[] = [
  "data/ndjson/provinces.ndjson",
  "data/ndjson/regions.ndjson",
  "data/ndjson/districts.ndjson",
  "data/ndjson/communes.ndjson",
  "data/ndjson/fokontanys.ndjson",
];

/**
 * The number of entries for each administrative level, indexed by level index (0-4).
 */
export const ADM_LEVEL_ENTRIES_COUNT_BY_CODE: Map<AdmLevelCode, number> =
  new Map<AdmLevelCode, number>([
    [AdmLevelCode.PROVINCE, 6],
    [AdmLevelCode.REGION, 24],
    [AdmLevelCode.DISTRICT, 119],
    [AdmLevelCode.COMMUNE, 1579],
    [AdmLevelCode.FOKONTANY, 17465],
  ]);

/**
 * The directory where the ADM seeding input files are generated.
 */
export const ADM_SEEDING_INPUTS_GENERATED_DIR = "data/inputs/.generated";

/**
 * The directory where the ADM seeding inputs files are officially stored in and pulled from.
 */
export const ADM_SEEDING_INPUTS_DIR = "data/inputs";

/**
 * Maps each administrative level code to its corresponding seeding input NDJSON filename.
 */
export const ADM_SEEDING_INPUT_FILENAMES_BY_CODE: Map<AdmLevelCode, string> =
  new Map<
    AdmLevelCode,
    string
  >([
    [AdmLevelCode.PROVINCE, "provinces.input.ndjson"],
    [AdmLevelCode.REGION, "regions.input.ndjson"],
    [AdmLevelCode.DISTRICT, "districts.input.ndjson"],
    [AdmLevelCode.COMMUNE, "communes.input.ndjson"],
    [AdmLevelCode.FOKONTANY, "fokontanys.input.ndjson"],
  ]);

/**
 * A mapping of Madagascar regions to their corresponding provinces.
 */
export const PROVINCE_BY_REGION_MAP: Map<string, ProvinceName> = new Map([
  ["Diana", ProvinceName.ANTSIRANANA],
  ["Sava", ProvinceName.ANTSIRANANA],
  ["Itasy", ProvinceName.ANTANANARIVO],
  ["Analamanga", ProvinceName.ANTANANARIVO],
  ["Vakinankaratra", ProvinceName.ANTANANARIVO],
  ["Bongolava", ProvinceName.ANTANANARIVO],
  ["Sofia", ProvinceName.MAHAJANGA],
  ["Boeny", ProvinceName.MAHAJANGA],
  ["Betsiboka", ProvinceName.MAHAJANGA],
  ["Melaky", ProvinceName.MAHAJANGA],
  ["Alaotra-Mangoro", ProvinceName.TOAMASINA],
  ["Atsinanana", ProvinceName.TOAMASINA],
  ["Ambatosoa", ProvinceName.TOAMASINA],
  ["Analanjirofo", ProvinceName.TOAMASINA],
  ["Amoron'i Mania", ProvinceName.FIANARANTSOA],
  ["Matsiatra Ambony", ProvinceName.FIANARANTSOA],
  ["Vatovavy", ProvinceName.FIANARANTSOA],
  ["Atsimo-Atsinanana", ProvinceName.FIANARANTSOA],
  ["Ihorombe", ProvinceName.FIANARANTSOA],
  ["Fitovinany", ProvinceName.FIANARANTSOA],
  ["Menabe", ProvinceName.TOLIARA],
  ["Atsimo-Andrefana", ProvinceName.TOLIARA],
  ["Androy", ProvinceName.TOLIARA],
  ["Anosy", ProvinceName.TOLIARA],
]);

/**
 * The directory where the ADM data catalogs are generated.
 */
export const ADM_CATALOGS_DIR = "data/catalogs";

/**
 * The directory where the ADM data catalogs are generated.
 */
export const ADM_CATALOGS_GENERATED_DIR = "data/catalogs/.generated";

/**
 * The CSV catalog file of ADM territories data for each administrative level.
 */
export const ADM_CSV_CATALOG_FILE_BY_LEVEL: Map<AdmLevelCode, string> = new Map(
  [
    [AdmLevelCode.PROVINCE, "provinces.csv"],
    [AdmLevelCode.REGION, "regions.csv"],
    [AdmLevelCode.DISTRICT, "districts.csv"],
    [AdmLevelCode.COMMUNE, "communes.csv"],
    [AdmLevelCode.FOKONTANY, "fokontanys.csv"],
  ],
);

/**
 * The fokontanys JSON data catalogs files by ADM level.
 */
export const ADM_FOKONTANYS_JSON_CATALOG_FILE_BY_CODE: Map<
  AdmLevelCode,
  string
> = new Map([
  [AdmLevelCode.FOKONTANY, "fokontanys.json"],
  [AdmLevelCode.COMMUNE, "fokontanys-by-commune.json"],
  [AdmLevelCode.DISTRICT, "fokontanys-by-district.json"],
  [AdmLevelCode.REGION, "fokontanys-by-region.json"],
  [AdmLevelCode.PROVINCE, "fokontanys-by-province.json"],
]);

/**
 * The communes JSON data catalogs files by ADM level.
 */
export const ADM_COMMUNES_JSON_CATALOG_FILE_BY_CODE: Map<AdmLevelCode, string> =
  new Map([
    [AdmLevelCode.COMMUNE, "communes.json"],
    [AdmLevelCode.DISTRICT, "communes-by-district.json"],
    [AdmLevelCode.REGION, "communes-by-region.json"],
    [AdmLevelCode.PROVINCE, "communes-by-province.json"],
  ]);

/**
 * The districts JSON data catalogs files by ADM level.
 */
export const ADM_DISTRICTS_JSON_CATALOG_FILE_BY_CODE: Map<
  AdmLevelCode,
  string
> = new Map([
  [AdmLevelCode.DISTRICT, "districts.json"],
  [AdmLevelCode.REGION, "districts-by-region.json"],
  [AdmLevelCode.PROVINCE, "districts-by-province.json"],
]);

/**
 * The regions JSON data catalogs files by ADM level.
 */
export const ADM_REGIONS_JSON_CATALOG_FILE_BY_CODE: Map<AdmLevelCode, string> =
  new Map([
    [AdmLevelCode.REGION, "regions.json"],
    [AdmLevelCode.PROVINCE, "regions-by-province.json"],
  ]);

/**
 * The provinces JSON data catalog file.
 */
export const ADM_PROVINCES_JSON_CATALOG_FILE = "provinces.json";
