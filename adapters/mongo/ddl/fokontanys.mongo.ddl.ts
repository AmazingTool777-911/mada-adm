import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import { MONGO_FR_COLLATION, MONGO_GEOJSON_VALIDATION } from "@scope/consts/db";
import { BaseAdmTableDDL } from "@scope/db/ddl/base";
import type { MadaAdmConfigValues } from "@scope/types/models";
import type { DbTransactionContext } from "@scope/types/db";
import type { MongoDbConnection } from "../mongo-db.connection.ts";
import { ensureIsMongoDbTransactionCtx } from "@scope/helpers/db";

/**
 * Concrete implementation of the DDL abstract class for the fokontanys collection
 * using MongoDB.
 */
export class FokontanysMongoDDL extends BaseAdmTableDDL {
  constructor(
    protected db: MongoDbConnection,
    config: MadaAdmConfigValues,
  ) {
    super(config, "");
  }

  get tableName(): string {
    return this.getTableName(
      ADM_LEVEL_TITLE_BY_CODE.get(AdmLevelCode.FOKONTANY)! + "s",
      "camel",
    );
  }

  async create(transactionContext?: DbTransactionContext): Promise<void> {
    const session = this.extractSession(transactionContext);

    const requiredFields = [
      "fokontany",
      "commune",
      "district",
      "region",
      "communeId",
      "createdAt",
      "updatedAt",
    ];
    if (this.config.hasAdmLevel) requiredFields.push("admLevel");
    if (this.config.hasGeojson) requiredFields.push("geojson");
    if (this.config.isProvinceRepeated) requiredFields.push("province");
    if (this.config.isFkRepeated) {
      requiredFields.push("districtId");
      requiredFields.push("regionId");
    }
    if (this.config.isProvinceFkRepeated) requiredFields.push("provinceId");

    const properties: Record<string, unknown> = {
      fokontany: { bsonType: "string" },
      commune: { bsonType: "string" },
      district: { bsonType: "string" },
      region: { bsonType: "string" },
      communeId: { bsonType: "objectId" },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    };

    if (this.config.isProvinceRepeated) {
      properties.province = { bsonType: "string" };
    }

    if (this.config.isFkRepeated) {
      properties.districtId = { bsonType: "objectId" };
      properties.regionId = { bsonType: "objectId" };
    }

    if (this.config.isProvinceFkRepeated) {
      properties.provinceId = { bsonType: "objectId" };
    }

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
      { fokontany: 1 },
      { collation: MONGO_FR_COLLATION, session },
    );

    await collection.createIndex(
      { communeId: 1 },
      { session },
    );

    if (this.config.isFkRepeated) {
      await collection.createIndex(
        { districtId: 1 },
        { session },
      );
      await collection.createIndex(
        { regionId: 1 },
        { session },
      );
    }

    if (this.config.isProvinceFkRepeated) {
      await collection.createIndex(
        { provinceId: 1 },
        { session },
      );
    }

    if (this.config.hasGeojson) {
      await collection.createIndex(
        { geojson: "2dsphere" },
        { session },
      );
    }
  }

  async drop(_transactionContext?: DbTransactionContext): Promise<void> {
    await this.db.db.dropCollection(this.tableName);
  }

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

let _instance: FokontanysMongoDDL | null = null;

export function injectFokontanysMongoDDL(
  config: MadaAdmConfigValues,
  db: MongoDbConnection,
): FokontanysMongoDDL {
  if (!_instance) _instance = new FokontanysMongoDDL(db, config);
  return _instance;
}

export function resetFokontanysMongoDDL(): void {
  _instance = null;
}
