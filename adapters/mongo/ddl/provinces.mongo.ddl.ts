import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import { MONGO_FR_COLLATION, MONGO_GEOJSON_VALIDATION } from "@scope/consts/db";
import { BaseAdmTableDDL } from "@scope/db/ddl/base";
import type { MadaAdmConfigValues } from "@scope/types/models";
import type { DbTransactionContext } from "@scope/types/db";
import type { MongoDbConnection } from "../mongo-db.connection.ts";
import { ensureIsMongoDbTransactionCtx } from "@scope/helpers/db";

/**
 * Concrete implementation of the DDL abstract class for the provinces collection
 * using MongoDB. It leverages the provided ADM configuration to dynamically
 * handle collection naming and optional features like geojson.
 */
export class ProvincesMongoDDL extends BaseAdmTableDDL {
  /**
   * Initializes a new instance of ProvincesMongoDDL.
   *
   * @param db - The MongoDB database connection.
   * @param config - The runtime ADM configuration to use for the collection definitions.
   */
  constructor(
    protected db: MongoDbConnection,
    config: MadaAdmConfigValues,
  ) {
    super(config, ""); // No schema concept in Mongo in the same way, just empty string or could be ignored.
  }

  /**
   * Generates the dynamic collection name based on the configuration prefix.
   *
   * @returns The resolved collection name in camelCase.
   */
  get tableName(): string {
    return this.getTableName(
      ADM_LEVEL_TITLE_BY_CODE.get(AdmLevelCode.PROVINCE)! + "s",
      "camel",
    );
  }

  /**
   * Creates the provinces physical collection in the MongoDB database if it does not already exist,
   * setting up the jsonSchema validation and indexes.
   *
   * @returns A promise that resolves when the collection creation is complete.
   */
  async create(transactionContext?: DbTransactionContext): Promise<void> {
    const session = this.extractSession(transactionContext);

    const requiredFields = ["province", "createdAt", "updatedAt"];
    if (this.config.hasAdmLevel) requiredFields.push("admLevel");
    if (this.config.hasGeojson) requiredFields.push("geojson");

    const properties: Record<string, unknown> = {
      province: { bsonType: "string" },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    };

    if (this.config.hasAdmLevel) {
      properties.admLevel = { bsonType: "number" };
    }

    if (this.config.hasGeojson) {
      properties.geojson = MONGO_GEOJSON_VALIDATION;
    }

    await this.db.db.createCollection(this.tableName, {
      collation: MONGO_FR_COLLATION,
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: requiredFields,
          properties,
        },
      },
      validationAction: "error",
      validationLevel: "strict",
      session,
    });

    const collection = this.db.db.collection(this.tableName);

    await collection.createIndex(
      { province: 1 },
      { collation: MONGO_FR_COLLATION, session },
    );

    if (this.config.hasGeojson) {
      await collection.createIndex(
        { geojson: "2dsphere" },
        { session },
      );
    }
  }

  /**
   * Drops the provinces physical collection from the MongoDB database if it exists.
   *
   * @returns A promise that resolves when the collection drop is complete.
   */
  async drop(_transactionContext?: DbTransactionContext): Promise<void> {
    await this.db.db.dropCollection(this.tableName);
  }

  /**
   * Checks if the provinces physical collection exists in the MongoDB database.
   *
   * @returns A promise that resolves to true if the collection exists, false otherwise.
   */
  async exists(_transactionContext?: DbTransactionContext): Promise<boolean> {
    const collections = await this.db.db.listCollections(
      { name: this.tableName },
    ).toArray();
    return collections.length > 0;
  }

  private extractSession(transactionContext?: DbTransactionContext) {
    return ensureIsMongoDbTransactionCtx(transactionContext)
      ? transactionContext.session
      : undefined;
  }
}

let _instance: ProvincesMongoDDL | null = null;

/**
 * Injects (or creates) an instance of {@link ProvincesMongoDDL}.
 *
 * @param config - The ADM configuration binding.
 * @param db - The MongoDB database connection.
 * @returns The instance of the provinces collection DDL.
 */
export function injectProvincesMongoDDL(
  config: MadaAdmConfigValues,
  db: MongoDbConnection,
): ProvincesMongoDDL {
  if (!_instance) _instance = new ProvincesMongoDDL(db, config);
  return _instance;
}

/**
 * Resets the singleton instance of the provinces collection DDL.
 */
export function resetProvincesMongoDDL(): void {
  _instance = null;
}
