import type { Collection } from "mongodb";
import type {
  MadaAdmConfigValues,
  Region,
  RegionBSON,
  RegionBSONRecordWithTimestamps,
} from "@scope/types/models";
import type { MongoDbConnection } from "@scope/adapters/mongo";
import { mapRegionBsonToEntity } from "@scope/helpers/models";
import { DbType } from "@scope/consts/db";
import { AdmLevelCode } from "@scope/consts/models";
import type { RegionQueries } from "../queries.d.ts";
import { AdmTableBaseQueries } from "../base/adm-table.base.queries.ts";

export class RegionMongoQueries extends AdmTableBaseQueries
  implements RegionQueries {
  #db!: MongoDbConnection;

  get collection(): Collection<RegionBSONRecordWithTimestamps> {
    return this.#db.db.collection<RegionBSONRecordWithTimestamps>(
      this.tableName,
    );
  }

  constructor(config: MadaAdmConfigValues, db: MongoDbConnection) {
    super(config, DbType.MongoDB, AdmLevelCode.REGION);
    this.#db = db;
  }

  async getAll(): Promise<Region[]> {
    const docs = await this.collection
      .find({})
      .project<RegionBSON>({ geojson: 0, _id: 1 })
      .toArray();
    return docs.map<Region>((doc) => mapRegionBsonToEntity(doc));
  }
}

let _instance: RegionMongoQueries | null = null;

export function injectRegionMongoQueries(
  config: MadaAdmConfigValues,
  db: MongoDbConnection,
): RegionMongoQueries {
  return _instance ?? (_instance = new RegionMongoQueries(config, db));
}
