import { type Collection, type Document, type Filter, ObjectId } from "mongodb";
import type {
  District,
  DistrictBSON,
  DistrictBSONRecordWithTimestamps,
  EntityId,
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { MongoDbConnection } from "@scope/adapters/mongo";
import { mapDistrictBsonToEntity } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import { incrementLastCharacterCodePoint } from "@scope/utils/string";
import { getAdmTableName } from "@scope/helpers/db";
import { AdmLevelCode } from "@scope/consts/models";
import type {
  GetDistrictByFokontanyGeoJsonOptions,
  GetDistrictByIdOptions,
  GetDistrictByPointCoodrdinatesOptions,
  GetManyDistrictsPaginationCursor,
  GetManyDistrictsQueryParams,
  PointCoordinates,
} from "../queries.d.ts";
import { DistrictBaseQueries } from "../base/district.base.queries.ts";
import { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";
import { getManyDistrictPaginationCursorSchema } from "../schemas/district.schemas.ts";

export class DistrictMongoQueries extends DistrictBaseQueries {
  #db!: MongoDbConnection;

  get collection(): Collection<DistrictBSONRecordWithTimestamps> {
    return this.#db.db.collection<DistrictBSONRecordWithTimestamps>(
      this.tableName,
    );
  }

  constructor(config: MadaAdmConfigValues, db: MongoDbConnection) {
    super(config, DbType.MongoDB);
    this.#db = db;
  }

  #getManyCursorPaginator = new QueryCursorPaginator<
    GetManyDistrictsPaginationCursor,
    District,
    GetManyDistrictsQueryParams
  >({
    toCursor: ({ district, id }) => ({ district, id }),
    queryFn: async ({ limit, cursor }, queryParams = {}) => {
      // Use a loose filter type to accommodate EntityId being assigned to ObjectId-typed FK fields
      const filter: Filter<Document> = {};

      if (queryParams.regionId) {
        filter["regionId"] = new ObjectId(queryParams.regionId);
      }

      if (queryParams.provinceId) {
        filter["provinceId"] = new ObjectId(queryParams.provinceId);
      }

      if (queryParams.search) {
        filter["district"] = {
          $gte: queryParams.search,
          $lt: incrementLastCharacterCodePoint(queryParams.search),
        };
      }

      if (cursor) {
        filter["$or"] = [
          { district: { $gt: cursor.district } },
          {
            district: cursor.district,
            _id: { $gte: new ObjectId(cursor.id) },
          },
        ];
      }

      const docs = await this.collection
        .find(filter)
        .sort({ district: 1 })
        .limit(limit)
        .project<DistrictBSON>({ geojson: 0 })
        .toArray();

      return docs.map((doc) => mapDistrictBsonToEntity(doc));
    },
    cursorEncodedSchema: getManyDistrictPaginationCursorSchema,
  });

  override get getManyCursorPaginator(): QueryCursorPaginator<
    GetManyDistrictsPaginationCursor,
    District,
    GetManyDistrictsQueryParams
  > {
    return this.#getManyCursorPaginator;
  }

  async getById(
    id: EntityId,
    options?: GetDistrictByIdOptions,
  ): Promise<District | null> {
    const district = await this.collection
      .findOne({ _id: new ObjectId(id) });
    if (!district) return null;
    options?.excludeGeoJSON && district.geojson && delete district.geojson;
    return mapDistrictBsonToEntity(district);
  }

  async _getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetDistrictByPointCoodrdinatesOptions,
  ): Promise<District | null> {
    const district = await this.collection
      .findOne({
        geojson: {
          $geoIntersects: {
            $geometry: {
              type: "Point",
              coordinates,
            },
          },
        },
      });
    if (!district) return null;
    options?.excludeGeoJSON && district.geojson && delete district.geojson;
    return mapDistrictBsonToEntity(district);
  }

  async _getByFokontanyGeoJson(
    fokontanyId: EntityId,
    options?: GetDistrictByFokontanyGeoJsonOptions,
  ): Promise<District | null> {
    const fokontanyCollection = getAdmTableName(
      AdmLevelCode.FOKONTANY,
      this.config,
      this.dbType,
    );
    const fokontany = await this.#db.db
      .collection(fokontanyCollection)
      .findOne(
        { _id: new ObjectId(fokontanyId) },
      );
    if (!fokontany || !fokontany.geojson) return null;

    const district = await this.collection
      .findOne({
        geojson: {
          $geoWithin: {
            $geometry: fokontany.geojson,
          },
        },
      });
    if (!district) return null;
    options?.excludeGeoJSON && district.geojson && delete district.geojson;
    return mapDistrictBsonToEntity(district);
  }
}

let _instance: DistrictMongoQueries | null = null;

export function injectDistrictMongoQueries(
  config: MadaAdmConfigValues,
  db: MongoDbConnection,
): DistrictMongoQueries {
  return _instance ?? (_instance = new DistrictMongoQueries(config, db));
}
