import path from "node:path";
import { TextLineStream } from "@std/streams";
import { CsvStringifyStream } from "@std/csv";
import {
  ADM_CATALOGS_GENERATED_DIR,
  ADM_COMMUNES_JSON_CATALOG_FILE_BY_CODE,
  ADM_CSV_CATALOG_FILE_BY_LEVEL,
  ADM_DISTRICTS_JSON_CATALOG_FILE_BY_CODE,
  ADM_FOKONTANYS_JSON_CATALOG_FILE_BY_CODE,
  ADM_LEVEL_CODES_INDEXED,
  ADM_LEVEL_TITLE_BY_CODE,
  ADM_PROVINCES_JSON_CATALOG_FILE,
  ADM_REGIONS_JSON_CATALOG_FILE_BY_CODE,
  ADM_SEEDING_INPUT_FILENAMES_BY_CODE,
  ADM_SEEDING_INPUTS_DIR,
  AdmLevelCode,
} from "@scope/consts/models";
import {
  AdmValues,
  CommuneValues,
  DistrictValues,
  FokontanyValues,
  ProvinceValues,
  RegionValues,
} from "@scope/types/models";

type CommunesValuesWithFokontanysValues = CommuneValues & {
  fokontanys: { fokontany: string; [key: string]: unknown }[];
};

type DistrictsValuesWithCommunesValues = DistrictValues & {
  communes: { commune: string; [key: string]: unknown }[];
};

type RegionsValuesWithDistrictsValues = RegionValues & {
  districts: { district: string; [key: string]: unknown }[];
};

type ProvincesValuesWithRegionsValues = ProvinceValues & {
  regions: { region: string; [key: string]: unknown }[];
};

type AdmParentsValuesWithChildrenValues =
  | ProvincesValuesWithRegionsValues
  | RegionsValuesWithDistrictsValues
  | DistrictsValuesWithCommunesValues
  | CommunesValuesWithFokontanysValues;

async function readAdmLevelInputFile(
  admLevelCode: AdmLevelCode,
  onDecoded: (admValues: AdmValues) => void,
) {
  const filePath = path.join(
    Deno.cwd(),
    ADM_SEEDING_INPUTS_DIR,
    ADM_SEEDING_INPUT_FILENAMES_BY_CODE.get(admLevelCode)!,
  );
  const fileReaderStream = (await Deno.open(filePath))
    .readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());
  for await (const line of fileReaderStream) {
    const admValues = JSON.parse(line) as AdmValues;
    onDecoded(admValues);
  }
}

async function writeCsvCatalog(
  admLevelCode: AdmLevelCode,
  values: AdmValues[],
  timestamp: string,
) {
  const filePath = path.join(
    Deno.cwd(),
    ADM_CATALOGS_GENERATED_DIR,
    timestamp,
    ADM_LEVEL_TITLE_BY_CODE.get(admLevelCode)!,
    ADM_CSV_CATALOG_FILE_BY_LEVEL.get(admLevelCode)!,
  );
  await Deno.mkdir(path.dirname(filePath), { recursive: true });
  using file = await Deno.open(filePath, {
    write: true,
    create: true,
  });

  const columns = Object.keys(values[0]);
  await ReadableStream.from(values)
    .pipeThrough(new CsvStringifyStream({ columns }))
    .pipeThrough(new TextEncoderStream())
    .pipeTo(file.writable);
}

async function writeJsonCatalog(
  rootAdmLevelCode: AdmLevelCode,
  admLevelCode: AdmLevelCode,
  values: AdmValues[],
  timestamp: string,
) {
  let fileName!: string;
  if (rootAdmLevelCode === AdmLevelCode.PROVINCE) {
    fileName = ADM_PROVINCES_JSON_CATALOG_FILE;
  } else {
    switch (rootAdmLevelCode) {
      case AdmLevelCode.REGION:
        fileName = ADM_REGIONS_JSON_CATALOG_FILE_BY_CODE.get(admLevelCode)!;
        break;
      case AdmLevelCode.DISTRICT:
        fileName = ADM_DISTRICTS_JSON_CATALOG_FILE_BY_CODE.get(admLevelCode)!;
        break;
      case AdmLevelCode.COMMUNE:
        fileName = ADM_COMMUNES_JSON_CATALOG_FILE_BY_CODE.get(admLevelCode)!;
        break;
      case AdmLevelCode.FOKONTANY:
        fileName = ADM_FOKONTANYS_JSON_CATALOG_FILE_BY_CODE.get(admLevelCode)!;
        break;
      default:
        throw new Error(
          `Unsupported ADM level code: ${rootAdmLevelCode satisfies never} in writeJsonCatalog`,
        );
    }
  }
  const filePath = path.join(
    Deno.cwd(),
    ADM_CATALOGS_GENERATED_DIR,
    timestamp,
    ADM_LEVEL_TITLE_BY_CODE.get(rootAdmLevelCode)!,
    fileName,
  );
  await Deno.mkdir(path.dirname(filePath), { recursive: true });
  const admValuesJSON = JSON.stringify(values, null, 2);
  await Deno.writeTextFile(filePath, admValuesJSON);
}

const provincesValues: ProvinceValues[] = [];
const regionsValues: RegionValues[] = [];
const districtsValues: DistrictValues[] = [];
const communesValues: CommuneValues[] = [];
const fokontanysValues: FokontanyValues[] = [];

const timestamp = Date.now().toString();

console.log("Reading provinces inputs ...");
await readAdmLevelInputFile(AdmLevelCode.PROVINCE, (_) => {
  const admValues = _ as ProvinceValues;
  provincesValues.push({ province: admValues.province });
});
console.log("Writing provinces CSV data catalog ...");
console.log();
await writeCsvCatalog(AdmLevelCode.PROVINCE, provincesValues, timestamp);

console.log("Reading regions inputs ...");
await readAdmLevelInputFile(AdmLevelCode.REGION, (_) => {
  const admValues = _ as RegionValues;
  const regionValues: RegionValues = {
    region: admValues.region,
    province: admValues.province,
  };
  regionsValues.push(regionValues);
});
console.log("Writing regions CSV data catalog ...");
console.log();
await writeCsvCatalog(AdmLevelCode.REGION, regionsValues, timestamp);

console.log("Reading districts inputs ...");
await readAdmLevelInputFile(AdmLevelCode.DISTRICT, (_) => {
  const admValues = _ as DistrictValues;
  const districtValues: DistrictValues = {
    district: admValues.district,
    region: admValues.region,
    province: admValues.province,
  };
  districtsValues.push(districtValues);
});
console.log("Writing districts CSV data catalog ...");
console.log();
await writeCsvCatalog(AdmLevelCode.DISTRICT, districtsValues, timestamp);

console.log("Reading communes inputs ...");
await readAdmLevelInputFile(AdmLevelCode.COMMUNE, (_) => {
  const admValues = _ as CommuneValues;
  const communeValues: CommuneValues = {
    commune: admValues.commune,
    district: admValues.district,
    region: admValues.region,
    province: admValues.province,
  };
  communesValues.push(communeValues);
});
console.log("Writing communes CSV data catalog ...");
console.log();
await writeCsvCatalog(AdmLevelCode.COMMUNE, communesValues, timestamp);

console.log("Reading fokontanys inputs ...");
await readAdmLevelInputFile(AdmLevelCode.FOKONTANY, (_) => {
  const admValues = _ as FokontanyValues;
  const fokontanyValues: FokontanyValues = {
    fokontany: admValues.fokontany,
    commune: admValues.commune,
    district: admValues.district,
    region: admValues.region,
    province: admValues.province,
  };
  fokontanysValues.push(fokontanyValues);
});
console.log("Writing fokontanys CSV data catalog ...");
console.log();
await writeCsvCatalog(AdmLevelCode.FOKONTANY, fokontanysValues, timestamp);

for (let i = ADM_LEVEL_CODES_INDEXED.length - 1; i >= 0; i--) {
  const rootAdmLevelCode = ADM_LEVEL_CODES_INDEXED[i];

  let admValues!: AdmValues[];
  switch (rootAdmLevelCode) {
    case AdmLevelCode.PROVINCE:
      admValues = provincesValues;

      break;
    case AdmLevelCode.REGION:
      admValues = regionsValues;
      break;
    case AdmLevelCode.DISTRICT:
      admValues = districtsValues;
      break;
    case AdmLevelCode.COMMUNE:
      admValues = communesValues;
      break;
    case AdmLevelCode.FOKONTANY:
      admValues = fokontanysValues;
      break;
    default:
      throw new Error(
        `Unsupported ADM level code: ${rootAdmLevelCode satisfies never}`,
      );
  }

  console.log(
    `Writing ${ADM_LEVEL_TITLE_BY_CODE.get(
      rootAdmLevelCode,
    )!}s JSON catalog ...`,
  );
  await writeJsonCatalog(
    rootAdmLevelCode,
    rootAdmLevelCode,
    admValues,
    timestamp,
  );

  let lastCatalog: AdmParentsValuesWithChildrenValues[] | AdmValues[] =
    admValues;

  for (let j = i - 1; j >= 0; j--) {
    const admLevelCode = ADM_LEVEL_CODES_INDEXED[j];

    switch (admLevelCode) {
      case AdmLevelCode.FOKONTANY:
        break;

      case AdmLevelCode.COMMUNE: {
        const fokontanys = lastCatalog as FokontanyValues[];
        const fokontanysByCommuneName = new Map<string, FokontanyValues[]>();
        for (const fokontany of fokontanys) {
          const communeUniqueName =
            `${fokontany.commune}:${fokontany.district}`;
          const communeFokontanys = fokontanysByCommuneName.get(
            communeUniqueName,
          );
          if (communeFokontanys) {
            communeFokontanys.push(fokontany);
          } else {
            fokontanysByCommuneName.set(communeUniqueName, [fokontany]);
          }
        }
        lastCatalog = [...fokontanysByCommuneName.values()].map<
          CommunesValuesWithFokontanysValues
        >((fokontanys) => {
          const fokontany = fokontanys[0];
          return {
            commune: fokontany.commune,
            district: fokontany.district,
            region: fokontany.region,
            province: fokontany.province,
            fokontanys: fokontanys.map((f) => ({ fokontany: f.fokontany })),
          };
        });
        break;
      }

      case AdmLevelCode.DISTRICT: {
        const communes = lastCatalog as CommunesValuesWithFokontanysValues[];
        const communesByDistrictName = new Map<
          string,
          CommunesValuesWithFokontanysValues[]
        >();
        for (const commune of communes) {
          const districtCommunes = communesByDistrictName.get(commune.district);
          if (districtCommunes) {
            districtCommunes.push(commune);
          } else {
            communesByDistrictName.set(commune.district, [commune]);
          }
        }
        lastCatalog = [...communesByDistrictName.values()].map<
          DistrictsValuesWithCommunesValues
        >((communes) => {
          const commune = communes[0];
          return {
            district: commune.district,
            region: commune.region,
            province: commune.province,
            communes: communes.map((c) => ({
              commune: c.commune,
              fokontanys: c.fokontanys,
            })),
          };
        });
        break;
      }

      case AdmLevelCode.REGION: {
        const districts = lastCatalog as DistrictsValuesWithCommunesValues[];
        const districtsByRegionName = new Map<
          string,
          DistrictsValuesWithCommunesValues[]
        >();
        for (const district of districts) {
          const regionDistricts = districtsByRegionName.get(district.region);
          if (regionDistricts) {
            regionDistricts.push(district);
          } else {
            districtsByRegionName.set(district.region, [district]);
          }
        }
        lastCatalog = [...districtsByRegionName.values()].map<
          RegionsValuesWithDistrictsValues
        >((districts) => {
          const district = districts[0];
          return {
            region: district.region,
            province: district.province!,
            districts: districts.map((d) => ({
              district: d.district,
              communes: d.communes,
            })),
          };
        });
        break;
      }

      case AdmLevelCode.PROVINCE: {
        const regions = lastCatalog as RegionsValuesWithDistrictsValues[];
        const regionsByProvinceName = new Map<
          string,
          RegionsValuesWithDistrictsValues[]
        >();
        for (const region of regions) {
          const provinceRegions = regionsByProvinceName.get(region.province);
          if (provinceRegions) {
            provinceRegions.push(region);
          } else {
            regionsByProvinceName.set(region.province, [region]);
          }
        }
        lastCatalog = [...regionsByProvinceName.values()].map<
          ProvincesValuesWithRegionsValues
        >((regions) => {
          const region = regions[0];
          return {
            province: region.province,
            regions: regions.map((r) => ({
              region: r.region,
              districts: r.districts,
            })),
          };
        });
        break;
      }

      default:
        throw new Error(
          `Unsupported ADM level code: ${admLevelCode satisfies never} in writeJsonCatalog`,
        );
    }

    console.log(
      `Writing ${ADM_LEVEL_TITLE_BY_CODE.get(
        admLevelCode,
      )!}s by ${ADM_LEVEL_TITLE_BY_CODE.get(
        rootAdmLevelCode,
      )!} JSON catalog ...`,
    );
    await writeJsonCatalog(
      rootAdmLevelCode,
      admLevelCode,
      lastCatalog,
      timestamp,
    );
  }
  console.log();
}
