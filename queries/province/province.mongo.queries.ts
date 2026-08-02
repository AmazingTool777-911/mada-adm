import { type Collection, ObjectId } from "mongodb";
import type {
  EntityId,
  MadaAdmConfigValues,
  Province,
  ProvinceBSON,
  ProvinceBSONRecordWithTimestamps,
} from "@scope/types/models";
import type { MongoDbConnection } from "@scope/adapters/mongo";
import { mapProvinceBsonToEntity } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type { GetProvinceByIdOptions, ProvinceQueries } from "../queries.d.ts";
import type {
  GetProvinceByPointCoordinatesOptions,
  PointCoordinates,
} from "../queries.d.ts";
import { ProvinceBaseQueries } from "../base/province.base.queries.ts";

export class ProvinceMongoQueries extends ProvinceBaseQueries
  implements ProvinceQueries {
  #db!: MongoDbConnection;

  get collection(): Collection<ProvinceBSONRecordWithTimestamps> {
    return this.#db.db.collection<ProvinceBSONRecordWithTimestamps>(
      this.tableName,
    );
  }

  constructor(config: MadaAdmConfigValues, db: MongoDbConnection) {
    super(config, DbType.MongoDB);
    this.#db = db;
  }

  async getAll(): Promise<Province[]> {
    const docs = await this.collection
      .find({})
      .project<ProvinceBSON>({ geojson: 0, _id: 1 })
      .toArray();
    return docs.map<Province>((doc) => mapProvinceBsonToEntity(doc));
  }

  async getById(
    id: EntityId,
    options?: GetProvinceByIdOptions,
  ): Promise<Province | null> {
    const province = await this.collection
      .findOne({ _id: new ObjectId(id) });
    if (!province) return null;
    options?.excludeGeoJSON && province.geojson && delete province.geojson;
    return mapProvinceBsonToEntity(province);
  }

  async _getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetProvinceByPointCoordinatesOptions,
  ): Promise<Province | null> {
    const doc = await this.collection
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
    if (!doc) return null;
    options?.excludeGeoJSON && doc.geojson && delete doc.geojson;
    return mapProvinceBsonToEntity(doc);
  }
}

let _instance: ProvinceMongoQueries | null = null;

export function injectProvinceMongoQueries(
  config: MadaAdmConfigValues,
  db: MongoDbConnection,
): ProvinceMongoQueries {
  return _instance ?? (_instance = new ProvinceMongoQueries(config, db));
}
