import { type Collection, type Document, type Filter, ObjectId } from "mongodb";
import type {
  EntityId,
  Fokontany,
  FokontanyBSON,
  FokontanyBSONRecordWithTimestamps,
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { MongoDbConnection } from "@scope/adapters/mongo";
import { mapFokontanyBsonToEntity } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type {
  GetFokontanyByIdOptions,
  GetManyFokontanysPaginationCursor,
  GetManyFokontanysQueryParams,
} from "../queries.d.ts";
import { FokontanyBaseQueries } from "../base/fokontany.base.queries.ts";
import { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";
import { getManyFokontanysPaginationCursorSchema } from "../schemas/fokontany.schemas.ts";
import { incrementLastCharacterCodePoint } from "@scope/utils/string";

export class FokontanyMongoQueries extends FokontanyBaseQueries {
  #db!: MongoDbConnection;

  get collection(): Collection<FokontanyBSONRecordWithTimestamps> {
    return this.#db.db.collection<FokontanyBSONRecordWithTimestamps>(
      this.tableName,
    );
  }

  constructor(config: MadaAdmConfigValues, db: MongoDbConnection) {
    super(config, DbType.MongoDB);
    this.#db = db;
  }

  #getManyCursorPaginator = new QueryCursorPaginator<
    GetManyFokontanysPaginationCursor,
    Fokontany,
    GetManyFokontanysQueryParams
  >({
    toCursor: ({ fokontany, id }) => ({ fokontany, id }),
    cursorEncodedSchema: getManyFokontanysPaginationCursorSchema,
    queryFn: async ({ limit, cursor }, queryParams = {}) => {
      // Use a loose filter type to accommodate EntityId being assigned to ObjectId-typed FK fields
      const filter: Filter<Document> = {};

      if (queryParams.communeId) {
        filter["communeId"] = new ObjectId(queryParams.communeId);
      }

      if (queryParams.districtId) {
        filter["districtId"] = new ObjectId(queryParams.districtId);
      }

      if (queryParams.regionId) {
        filter["regionId"] = new ObjectId(queryParams.regionId);
      }

      if (queryParams.provinceId) {
        filter["provinceId"] = new ObjectId(queryParams.provinceId);
      }

      if (queryParams.search) {
        filter["fokontany"] = {
          $gte: queryParams.search,
          $lt: incrementLastCharacterCodePoint(queryParams.search),
        };
      }

      if (cursor) {
        filter["$or"] = [
          { fokontany: { $gt: cursor.fokontany } },
          {
            fokontany: cursor.fokontany,
            _id: { $gte: new ObjectId(cursor.id) },
          },
        ];
      }

      const docs = await this.collection
        .find(filter)
        .sort({ fokontany: 1 })
        .limit(limit)
        .project<FokontanyBSON>({ geojson: 0 })
        .toArray();

      return docs.map((doc) => mapFokontanyBsonToEntity(doc));
    },
  });

  override get getManyCursorPaginator(): QueryCursorPaginator<
    GetManyFokontanysPaginationCursor,
    Fokontany,
    GetManyFokontanysQueryParams
  > {
    return this.#getManyCursorPaginator;
  }

  async getById(
    id: EntityId,
    options?: GetFokontanyByIdOptions,
  ): Promise<Fokontany | null> {
    const fokontany = await this.collection
      .findOne({ _id: new ObjectId(id) });
    if (!fokontany) return null;
    options?.excludeGeoJSON && fokontany.geojson && delete fokontany.geojson;
    return mapFokontanyBsonToEntity(fokontany);
  }
}

let _instance: FokontanyMongoQueries | null = null;

export function injectFokontanyMongoQueries(
  config: MadaAdmConfigValues,
  db: MongoDbConnection,
): FokontanyMongoQueries {
  return _instance ?? (_instance = new FokontanyMongoQueries(config, db));
}
