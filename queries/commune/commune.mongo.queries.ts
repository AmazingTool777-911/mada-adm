import { type Collection, type Document, type Filter, ObjectId } from "mongodb";
import type {
  Commune,
  CommuneBSON,
  CommuneBSONRecordWithTimestamps,
  MadaAdmConfigValues,
} from "@scope/types/models";
import type { MongoDbConnection } from "@scope/adapters/mongo";
import { mapCommuneBsonToEntity } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type {
  GetManyCommunesPaginationCursor,
  GetManyCommunesQueryParams,
} from "../queries.d.ts";
import { CommuneBaseQueries } from "../base/commune.base.queries.ts";
import { QueryCursorPaginator } from "../helpers/query-cursor-paginator.helper.ts";

export class CommuneMongoQueries extends CommuneBaseQueries {
  #db!: MongoDbConnection;

  get collection(): Collection<CommuneBSONRecordWithTimestamps> {
    return this.#db.db.collection<CommuneBSONRecordWithTimestamps>(
      this.tableName,
    );
  }

  constructor(config: MadaAdmConfigValues, db: MongoDbConnection) {
    super(config, DbType.MongoDB);
    this.#db = db;
  }

  #getManyCursorPaginator = new QueryCursorPaginator<
    GetManyCommunesPaginationCursor,
    Commune,
    GetManyCommunesQueryParams
  >({
    toCursor: ({ commune, id }) => ({ commune, id }),
    queryFn: async ({ limit, cursor }, queryParams = {}) => {
      // Use a loose filter type to accommodate EntityId being assigned to ObjectId-typed FK fields
      const filter: Filter<Document> = {};

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
        const searchStr = queryParams.search;
        const lastChar = searchStr.charAt(searchStr.length - 1);
        const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
        const upperBound = searchStr.slice(0, -1) + nextChar;

        filter["commune"] = { $gte: searchStr, $lt: upperBound };
      }

      if (cursor) {
        filter["$or"] = [
          { commune: { $gt: cursor.commune } },
          {
            commune: cursor.commune,
            _id: { $gte: new ObjectId(cursor.id) },
          },
        ];
      }

      const docs = await this.collection
        .find(filter)
        .sort({ commune: 1 })
        .limit(limit)
        .project<CommuneBSON>({ geojson: 0 })
        .toArray();

      return docs.map((doc) => mapCommuneBsonToEntity(doc));
    },
  });

  override get getManyCursorPaginator(): QueryCursorPaginator<
    GetManyCommunesPaginationCursor,
    Commune,
    GetManyCommunesQueryParams
  > {
    return this.#getManyCursorPaginator;
  }
}

let _instance: CommuneMongoQueries | null = null;

export function injectCommuneMongoQueries(
  config: MadaAdmConfigValues,
  db: MongoDbConnection,
): CommuneMongoQueries {
  return _instance ?? (_instance = new CommuneMongoQueries(config, db));
}
