import type {
  MadaAdmConfig,
  MadaAdmConfigBSON,
  MadaAdmConfigDML,
  MadaAdmConfigValues,
} from "@scope/types/db";
import type { MongoDbConnection } from "../mongo-db.connection.ts";
import { MADA_ADM_CONFIGS_TABLE_NAME_CAMEL_CASED } from "@scope/consts/db";
import { mapMadaAdmConfigBsonToEntity } from "@scope/helpers/models";

/**
 * MongoDB implementation of the MadaAdmConfigDML interface.
 */
export class MadaAdmConfigMongoDML implements MadaAdmConfigDML {
  readonly #dbConnection: MongoDbConnection;

  readonly tableName = MADA_ADM_CONFIGS_TABLE_NAME_CAMEL_CASED;

  constructor(dbConnection: MongoDbConnection) {
    this.#dbConnection = dbConnection;
  }

  get #collection() {
    return this.#dbConnection.db.collection<MadaAdmConfigBSON>(this.tableName);
  }

  /**
   * Retrieves the current Mada ADM configuration.
   *
   * @returns The configuration entity or null if not found.
   */
  async get(): Promise<MadaAdmConfig | null> {
    const bson = await this.#collection.findOne({});
    return bson ? mapMadaAdmConfigBsonToEntity(bson) : null;
  }

  /**
   * Creates or updates the Mada ADM configuration.
   *
   * @param values - The configuration values to set.
   * @returns The created or updated configuration entity.
   */
  async createOrUpdate(values: MadaAdmConfigValues): Promise<MadaAdmConfig> {
    const now = new Date();
    const result = await this.#collection.findOneAndUpdate(
      {},
      {
        $set: {
          ...values,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    if (!result) {
      throw new Error("Failed to create or update Mada ADM configuration.");
    }

    return mapMadaAdmConfigBsonToEntity(result);
  }
}

let _instance: MadaAdmConfigMongoDML;

export function injectMadaAdmConfigMongoDML(
  dbConnection: MongoDbConnection,
): MadaAdmConfigDML {
  _instance = _instance ?? new MadaAdmConfigMongoDML(dbConnection);
  return _instance;
}
