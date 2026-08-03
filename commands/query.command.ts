import { colors } from "@cliffy/ansi/colors";
import { Command, EnumType, ValidationError } from "@cliffy/command";
import { Select } from "@cliffy/prompt";
import { convert } from "geo-coordinates-parser";

import {
  QUERY_COMMAND_ARGUMENTS_DESCRIPTIONS,
  QUERY_COMMAND_DESCRIPTION,
  QUERY_COMMAND_NAME,
  QUERY_COMMAND_OPTIONS_DESCRIPTIONS,
} from "@scope/consts/cli";
import { injectDbConnection, injectMadaAdmConfigDML } from "@scope/db";
import { injectAdmEntityQueries } from "@scope/queries/adm-entity";
import { injectCommuneQueries } from "@scope/queries/commune";
import { injectDistrictQueries } from "@scope/queries/district";
import { injectFokontanyQueries } from "@scope/queries/fokontany";
import { injectProvinceQueries } from "@scope/queries/province";
import { injectRegionQueries } from "@scope/queries/region";
import { resolveCommonGlobalCliConfig } from "@scope/helpers/cli";
import type {
  GlobalCliConfig,
  QueryCliCommandLevel,
  QueryCliCommandType,
  QueryCliOptions,
} from "@scope/types/cli";
import type { DbConnection } from "@scope/types/db";
import type {
  AdmEntityQueries,
  CommuneQueries,
  DistrictQueries,
  FokontanyQueries,
  GetAdmEntitiesUnionPaginationCursor,
  GetManyCommunesPaginationCursor,
  GetManyDistrictsPaginationCursor,
  GetManyFokontanysPaginationCursor,
  PointCoordinates,
  ProvinceQueries,
  RegionQueries,
} from "@scope/queries/types";
import { AdmEntity } from "@scope/types/models";

const queryType = new EnumType<QueryCliCommandType>([
  "name",
  "id",
  "coordinates",
]);
const admLevelType = new EnumType<QueryCliCommandLevel>([
  "province",
  "region",
  "district",
  "commune",
  "fokontany",
]);

interface QueryContext {
  injectAdmEntityQueries: () => Promise<AdmEntityQueries>;
  injectProvinceQueries: () => Promise<ProvinceQueries>;
  injectRegionQueries: () => Promise<RegionQueries>;
  injectDistrictQueries: () => Promise<DistrictQueries>;
  injectCommuneQueries: () => Promise<CommuneQueries>;
  injectFokontanyQueries: () => Promise<FokontanyQueries>;
}

type QueryNameTypeCursor =
  | GetAdmEntitiesUnionPaginationCursor
  | GetManyDistrictsPaginationCursor
  | GetManyCommunesPaginationCursor
  | GetManyFokontanysPaginationCursor;

export class CliQueryCommand extends Command<
  GlobalCliConfig,
  void,
  QueryCliOptions
> {
  constructor() {
    super();
    this
      .name(QUERY_COMMAND_NAME)
      .description(QUERY_COMMAND_DESCRIPTION)
      .type("queryType", queryType)
      .type("admLevelType", admLevelType)
      .arguments("<search:string>", [
        QUERY_COMMAND_ARGUMENTS_DESCRIPTIONS.SEARCH,
      ])
      .option(
        "--type <type:queryType>",
        QUERY_COMMAND_OPTIONS_DESCRIPTIONS.TYPE,
        {
          default: "name" as const,
        },
      )
      .option(
        "--level <level:admLevelType>",
        QUERY_COMMAND_OPTIONS_DESCRIPTIONS.LEVEL,
      )
      .option(
        "--page-size <pageSize:number>",
        QUERY_COMMAND_OPTIONS_DESCRIPTIONS.PAGE_SIZE,
        {
          default: 10,
          depends: ["type"],
        },
      )
      .action(async (options, search) => {
        try {
          await this.handleQuery(options, search);
        } catch (error) {
          console.error(
            `\n${colors.red("❌ Error:")} ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          Deno.exit(1);
        }
      });
  }

  private startLoading(): { stop: () => void } {
    let dots = 0;
    Deno.stdout.writeSync(
      new TextEncoder().encode(
        `Loading...`,
      ),
    );
    const timer = setInterval(() => {
      Deno.stdout.writeSync(
        new TextEncoder().encode(
          `\rLoading${".".repeat(dots)}${" ".repeat(3 - dots)}`,
        ),
      );
      dots = (dots + 1) % 4;
    }, 250);
    return {
      stop: () => {
        clearInterval(timer);
        Deno.stdout.writeSync(
          new TextEncoder().encode(`\r${" ".repeat(15)}\r`),
        );
      },
    };
  }

  private async handleQuery(
    options: QueryCliOptions & GlobalCliConfig,
    search: string,
  ): Promise<void> {
    let db!: DbConnection;

    try {
      const { dbType, pgSchema } = resolveCommonGlobalCliConfig(options);

      db = await injectDbConnection(dbType);
      const madaAdmConfigDML = await injectMadaAdmConfigDML(dbType, db, {
        pgSchema,
      });

      const config = await madaAdmConfigDML.get();
      if (!config) {
        throw new Error(
          "Mada ADM configuration not found. Run index command first.",
        );
      }

      const context: QueryContext = {
        injectAdmEntityQueries: () =>
          injectAdmEntityQueries(config, dbType, db, {
            pgSchema,
          }),
        injectProvinceQueries: () =>
          injectProvinceQueries(config, dbType, db, {
            pgSchema,
          }),
        injectRegionQueries: () =>
          injectRegionQueries(config, dbType, db, {
            pgSchema,
          }),
        injectDistrictQueries: () =>
          injectDistrictQueries(config, dbType, db, {
            pgSchema,
          }),
        injectCommuneQueries: () =>
          injectCommuneQueries(config, dbType, db, {
            pgSchema,
          }),
        injectFokontanyQueries: () =>
          injectFokontanyQueries(config, dbType, db, {
            pgSchema,
          }),
      };

      switch (options.type) {
        case "name":
          await this.handleNameQuery(search, options, context);
          break;
        case "id":
          await this.handleIdQuery(search, options, context);
          break;
        case "coordinates":
          await this.handleCoordinatesQuery(search, options, context);
          break;
        default:
          throw new ValidationError(`Unsupported query type: ${options.type}`);
      }
    } finally {
      if (db) {
        await db.close();
      }
    }
  }

  private async handleNameQuery(
    search: string,
    options: QueryCliOptions,
    context: QueryContext,
  ): Promise<void> {
    let loader!: ReturnType<typeof this.startLoading>;

    try {
      let nextCursor: QueryNameTypeCursor | null = null;
      let hasMore = true;

      while (hasMore) {
        loader = this.startLoading();

        let records: AdmEntity[] = [];
        let next: QueryNameTypeCursor | null = null;

        if (!options.level) {
          const admEntityQueries = await context.injectAdmEntityQueries();
          const result = await admEntityQueries.getUnionCursorPaginated(
            {
              limit: options.pageSize,
              cursor: nextCursor as GetAdmEntitiesUnionPaginationCursor | null,
            },
            { search },
          );
          records = result.records;
          next = result.next;
        } else {
          switch (options.level) {
            case "province": {
              const provinceQueries = await context.injectProvinceQueries();
              let provinces = await provinceQueries.getAll();
              provinces = provinces.filter((p) =>
                p.province.toLocaleLowerCase("fr").startsWith(
                  search.toLocaleLowerCase("fr"),
                )
              );
              records = provinces;
              next = null;
              break;
            }
            case "region": {
              const regionQueries = await context.injectRegionQueries();
              let regions = await regionQueries.getAll();
              regions = regions.filter((p) =>
                p.region.toLocaleLowerCase("fr").startsWith(
                  search.toLocaleLowerCase("fr"),
                )
              );
              records = regions;
              next = null;
              break;
            }
            case "district": {
              const districtQueries = await context.injectDistrictQueries();
              const result = await districtQueries
                .getManyCursorPaginated({
                  limit: options.pageSize,
                  cursor: nextCursor as GetManyDistrictsPaginationCursor | null,
                }, { search });
              records = result.records;
              next = result.next;
              break;
            }
            case "commune": {
              const communeQueries = await context.injectCommuneQueries();
              const result = await communeQueries
                .getManyCursorPaginated({
                  limit: options.pageSize,
                  cursor: nextCursor as GetManyCommunesPaginationCursor | null,
                }, { search });
              records = result.records;
              next = result.next;
              break;
            }
            case "fokontany": {
              const fokontanyQueries = await context.injectFokontanyQueries();
              const result = await fokontanyQueries
                .getManyCursorPaginated({
                  limit: options.pageSize,
                  cursor: nextCursor as
                    | GetManyFokontanysPaginationCursor
                    | null,
                }, { search });
              records = result.records;
              next = result.next;
              break;
            }
          }
        }

        loader.stop();

        if (records.length === 0 && !nextCursor) {
          const levelTitle = options.level ?? "territory";
          console.log(
            colors.gray(
              `No ${levelTitle} was found for "${search}" search text.`,
            ),
          );
          return;
        }

        for (const record of records) {
          console.log(JSON.stringify(record, null, 2));
          console.log();
        }

        if (next) {
          const choice = await Select.prompt({
            message: "Show next page?",
            options: [
              { name: "Next page", value: "next" },
              { name: "Quit", value: "quit" },
            ],
          });
          if (choice === "next") {
            nextCursor = next;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
    } finally {
      loader.stop();
    }
  }

  private async handleIdQuery(
    search: string,
    options: QueryCliOptions,
    context: QueryContext,
  ): Promise<void> {
    if (!options.level) {
      throw new ValidationError(
        "ADM level option --level is required when type is 'id'.",
      );
    }

    const loader = this.startLoading();
    try {
      let record: AdmEntity | null = null;

      switch (options.level) {
        case "province": {
          const provinceQueries = await context.injectProvinceQueries();
          record = await provinceQueries.getById(search, {
            excludeGeoJSON: true,
          });
          break;
        }
        case "region": {
          const regionQueries = await context.injectRegionQueries();
          record = await regionQueries.getById(search, {
            excludeGeoJSON: true,
          });
          break;
        }
        case "district": {
          const districtQueries = await context.injectDistrictQueries();
          record = await districtQueries.getById(search, {
            excludeGeoJSON: true,
          });
          break;
        }
        case "commune": {
          const communeQueries = await context.injectCommuneQueries();
          record = await communeQueries.getById(search, {
            excludeGeoJSON: true,
          });
          break;
        }
        case "fokontany": {
          const fokontanyQueries = await context.injectFokontanyQueries();
          record = await fokontanyQueries.getById(search, {
            excludeGeoJSON: true,
          });
          break;
        }
      }

      loader.stop();

      if (!record) {
        console.log(
          colors.gray(`No ${options.level} was found for id ${search}`),
        );
      } else {
        console.log(JSON.stringify(record, null, 2));
      }
    } finally {
      loader.stop();
    }
  }

  private async handleCoordinatesQuery(
    search: string,
    options: QueryCliOptions,
    context: QueryContext,
  ): Promise<void> {
    let lat: number;
    let lng: number;

    try {
      const parsed = convert(search);
      lat = parsed.decimalLatitude;
      lng = parsed.decimalLongitude;
    } catch (_error) {
      throw new ValidationError(
        `Failed to parse coordinates: "${search}". ` +
          `The coordinates must be valid geographic coordinates values. ` +
          `Wrap the coordinates inside "" double quotes if space-separated.`,
      );
    }

    const point: PointCoordinates = [lng, lat];
    const level = options.level ?? "fokontany";

    const loader = this.startLoading();

    try {
      let record: AdmEntity | null = null;

      switch (level) {
        case "province": {
          const provinceQueries = await context.injectProvinceQueries();
          record = await provinceQueries.getByPointCoordinates(point, {
            excludeGeoJSON: true,
          });
          break;
        }
        case "region": {
          const regionQueries = await context.injectRegionQueries();
          record = await regionQueries.getByPointCoordinates(point, {
            excludeGeoJSON: true,
          });
          break;
        }
        case "district": {
          const districtQueries = await context.injectDistrictQueries();
          record = await districtQueries.getByPointCoordinates(point, {
            excludeGeoJSON: true,
          });
          break;
        }
        case "commune": {
          const communeQueries = await context.injectCommuneQueries();
          record = await communeQueries.getByPointCoordinates(point, {
            excludeGeoJSON: true,
          });
          break;
        }
        case "fokontany": {
          const fokontanyQueries = await context.injectFokontanyQueries();
          record = await fokontanyQueries.getByPointCoordinates(point, {
            excludeGeoJSON: true,
          });
          break;
        }
      }

      loader.stop();

      if (!record) {
        console.log(
          colors.gray(`No ${level} was found for coordinates "${search}"`),
        );
      } else {
        console.log(JSON.stringify(record, null, 2));
      }
    } finally {
      loader.stop();
    }
  }
}

let _command: CliQueryCommand | null = null;

export function injectCliQueryCommand(): CliQueryCommand {
  if (!_command) _command = new CliQueryCommand();
  return _command;
}
