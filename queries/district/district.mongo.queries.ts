import { type Collection, type Document, type Filter, ObjectId } from "mongodb";
import type {
  District,
  DistrictBSON,
  DistrictBSONRecordWithTimestamps,
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { MongoDbConnection } from "@scope/adapters/mongo";
import { mapDistrictBsonToEntity } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type {
  GetManyDistrictsPaginationCursor,
  GetManyDistrictsQueryParams,
} from "../queries.d.ts";
import { DistrictBaseQueries } from "../base/district.base.queries.ts";
import { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";

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
        const searchStr = queryParams.search;
        const lastChar = searchStr.charAt(searchStr.length - 1);
        const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
        const upperBound = searchStr.slice(0, -1) + nextChar;

        filter["district"] = { $gte: searchStr, $lt: upperBound };
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
        .sort({ district: 1, _id: 1 })
        .limit(limit)
        .project<DistrictBSON>({ geojson: 0 })
        .toArray();

      return docs.map((doc) => mapDistrictBsonToEntity(doc));
    },
  });

  override get getManyCursorPaginator(): QueryCursorPaginator<
    GetManyDistrictsPaginationCursor,
    District,
    GetManyDistrictsQueryParams
  > {
    return this.#getManyCursorPaginator;
  }
}

let _instance: DistrictMongoQueries | null = null;

export function injectDistrictMongoQueries(
  config: MadaAdmConfigValues,
  db: MongoDbConnection,
): DistrictMongoQueries {
  return _instance ?? (_instance = new DistrictMongoQueries(config, db));
}
