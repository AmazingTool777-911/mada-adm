import { type Collection, ObjectId } from "mongodb";
import type {
  EntityId,
  MadaAdmConfigValues,
  Region,
  RegionBSON,
  RegionBSONRecordWithTimestamps,
} from "@scope/types/models";
import type { MongoDbConnection } from "@scope/adapters/mongo";
import { mapRegionBsonToEntity } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import type { GetRegionByIdOptions, RegionQueries } from "../queries.d.ts";
import type {
  GetRegionByPointCoordinatesOptions,
  PointCoordinates,
} from "../queries.d.ts";
import { RegionBaseQueries } from "../base/region.base.queries.ts";

export class RegionMongoQueries extends RegionBaseQueries
  implements RegionQueries {
  #db!: MongoDbConnection;

  get collection(): Collection<RegionBSONRecordWithTimestamps> {
    return this.#db.db.collection<RegionBSONRecordWithTimestamps>(
      this.tableName,
    );
  }

  constructor(config: MadaAdmConfigValues, db: MongoDbConnection) {
    super(config, DbType.MongoDB);
    this.#db = db;
  }

  async getAll(): Promise<Region[]> {
    const docs = await this.collection
      .find({})
      .project<RegionBSON>({ geojson: 0, _id: 1 })
      .toArray();
    return docs.map<Region>((doc) => mapRegionBsonToEntity(doc));
  }

  async getById(
    id: EntityId,
    options?: GetRegionByIdOptions,
  ): Promise<Region | null> {
    const region = await this.collection
      .findOne({ _id: new ObjectId(id) });
    if (!region) return null;
    options?.excludeGeoJSON && region.geojson && delete region.geojson;
    return mapRegionBsonToEntity(region);
  }

  async _getByPointCoordinates(
    coordinates: PointCoordinates,
    options?: GetRegionByPointCoordinatesOptions,
  ): Promise<Region | null> {
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
    return mapRegionBsonToEntity(doc);
  }
}

let _instance: RegionMongoQueries | null = null;

export function injectRegionMongoQueries(
  config: MadaAdmConfigValues,
  db: MongoDbConnection,
): RegionMongoQueries {
  return _instance ?? (_instance = new RegionMongoQueries(config, db));
}
