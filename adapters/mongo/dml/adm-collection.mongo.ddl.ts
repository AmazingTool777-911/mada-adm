import type {
  AdmAttributes,
  AdmEntity,
  AdmEntityBSON,
  AdmRecord,
  MadaAdmConfig,
} from "@scope/types/models";
import type { MongoDbConnection } from "../mongo-db.connection.ts";
import { StringUtils } from "@scope/utils";
import {
  ADM_LEVEL_CODES_INDEXED,
  ADM_LEVEL_INDEX_BY_CODE,
  ADM_LEVEL_TITLE_BY_CODE,
  AdmLevelCode,
} from "@scope/consts/models";
import type {
  DbTransactionContext,
  DMLCreateManyResult,
  DMLUpdateResult,
  EntityId,
  RegionRecord,
} from "@scope/types/db";
import type {
  AdmEntityFks,
  AdmRecordBSONWithTimestamps,
} from "@scope/types/models";
import { ensureIsMongoDbTransactionCtx } from "@scope/helpers/db";
import {
  isCommuneValues,
  isDistrictValues,
  isFokontanyValues,
  isProvinceValues,
  isRegionValues,
  mapAdmEntityBsonToEntity,
} from "@scope/helpers/models";
import type { GeoJSONGeometry } from "@scope/types/utils";
import { ObjectId } from "mongodb";

export class BaseAdmCollectionMongoDDL {
  #dbConnection!: MongoDbConnection;

  #config!: MadaAdmConfig;

  #admLevel!: AdmLevelCode;

  get admLevelTitle() {
    return ADM_LEVEL_TITLE_BY_CODE.get(this.#admLevel)!;
  }

  get collectionName() {
    return this.getCollectionName(`${this.admLevelTitle}s`);
  }

  get collection() {
    return this.#dbConnection.db.collection<AdmRecordBSONWithTimestamps>(
      this.collectionName,
    );
  }

  constructor(
    dbConnection: MongoDbConnection,
    config: MadaAdmConfig,
    admLevel: AdmLevelCode,
  ) {
    this.#dbConnection = dbConnection;
    this.#config = config;
    this.#admLevel = admLevel;
  }

  /**
   * Generates the physical database collection name by applying
   * the prefix from the configuration.
   *
   * @param baseName - The base name of the administrative collection (e.g., 'regions').
   * @returns The resolved collection name (e.g., 'mada_regions').
   */
  protected getCollectionName(baseName: string): string {
    return StringUtils.prefixWithCamelCase(
      this.#config.tablesPrefix,
      baseName,
    );
  }

  /**
   * Fetches multiple administrative entities matching a list of attribute sets.
   *
   * @param attributesValues - A list of attribute sets (e.g., [{province: 'Antananarivo'}]).
   * @param transactionContext - Optional database transaction context.
   * @returns An array of mapped administrative entities.
   */
  protected async _getManyByAttributes(
    attributesValues: AdmAttributes[],
    transactionContext?: DbTransactionContext,
  ): Promise<AdmEntity[]> {
    const session = ensureIsMongoDbTransactionCtx(transactionContext)
      ? transactionContext.session
      : undefined;

    if (attributesValues.length === 0) return [];

    const results = await this.collection
      .aggregate<AdmEntityBSON>(
        [
          {
            $match: {
              $or: attributesValues,
            },
          },
        ],
        { session },
      ).toArray();

    return results.map((res) => mapAdmEntityBsonToEntity(res));
  }

  /**
   * Updates the GeoJSON data for a specific administrative entity identified by its attributes.
   *
   * @param identifiers - The attributes used to identify the entity.
   * @param geojson - The new GeoJSON string to set.
   * @param transactionContext - Optional database transaction context.
   * @returns An object containing the number of affected rows.
   */
  protected async _updateGeojsonByIdentifiers(
    identifiers: AdmAttributes,
    geojson: string,
    transactionContext?: DbTransactionContext,
  ): Promise<DMLUpdateResult> {
    const session = ensureIsMongoDbTransactionCtx(transactionContext)
      ? transactionContext.session
      : undefined;

    const geojsonParsed = JSON.parse(geojson) as GeoJSONGeometry;
    const result = await this.collection
      .updateOne(
        identifiers,
        {
          $set: {
            geojson: geojsonParsed,
          },
        },
        { session },
      );

    return { affectedRows: result.modifiedCount };
  }

  /**
   * Creates multiple administrative entities.
   *
   * @param records - An array of administrative entities to create.
   * @param transactionContext - Optional database transaction context.
   * @returns An object containing the number of inserted rows.
   */
  protected async _createMany(
    records: AdmRecord[],
    transactionContext?: DbTransactionContext,
  ): Promise<DMLCreateManyResult> {
    const session = ensureIsMongoDbTransactionCtx(transactionContext)
      ? transactionContext.session
      : undefined;

    if (records.length === 0) return { insertedCount: 0 };

    const bsonRecords = records.map<AdmRecordBSONWithTimestamps>((r) => {
      const now = new Date();
      if (isFokontanyValues(r)) {
        const provinceId = r.provinceId && this.#config.isProvinceFkRepeated
          ? new ObjectId(r.provinceId)
          : undefined;
        let districtId: ObjectId | undefined, regionId: ObjectId | undefined;
        if (this.#config.isFkRepeated) {
          districtId = r.districtId ? new ObjectId(r.districtId) : undefined;
          regionId = r.regionId ? new ObjectId(r.regionId) : undefined;
        }
        return {
          ...r,
          communeId: new ObjectId(r.communeId),
          districtId,
          regionId,
          provinceId,
          province: this.#config.isProvinceRepeated ? r.province : undefined,
          admLevel: this.#config.hasAdmLevel ? r.admLevel : undefined,
          geojson: this.#config.hasGeojson ? r.geojson : undefined,
          createdAt: now,
          updatedAt: now,
        };
      } else if (isCommuneValues(r)) {
        const provinceId = r.provinceId && this.#config.isProvinceFkRepeated
          ? new ObjectId(r.provinceId)
          : undefined;
        let regionId: ObjectId | undefined;
        if (this.#config.isFkRepeated) {
          regionId = r.regionId ? new ObjectId(r.regionId) : undefined;
        }
        return {
          ...r,
          districtId: new ObjectId(r.districtId),
          regionId,
          provinceId,
          province: this.#config.isProvinceRepeated ? r.province : undefined,
          admLevel: this.#config.hasAdmLevel ? r.admLevel : undefined,
          geojson: this.#config.hasGeojson ? r.geojson : undefined,
          createdAt: now,
          updatedAt: now,
        };
      } else if (isDistrictValues(r)) {
        const provinceId = r.provinceId && this.#config.isProvinceFkRepeated
          ? new ObjectId(r.provinceId)
          : undefined;
        return {
          ...r,
          regionId: new ObjectId(r.regionId),
          provinceId,
          province: this.#config.isProvinceRepeated ? r.province : undefined,
          admLevel: this.#config.hasAdmLevel ? r.admLevel : undefined,
          geojson: this.#config.hasGeojson ? r.geojson : undefined,
          createdAt: now,
          updatedAt: now,
        };
      } else if (isRegionValues(r)) {
        return {
          ...r,
          provinceId: new ObjectId((r as RegionRecord).provinceId),
          admLevel: this.#config.hasAdmLevel ? r.admLevel : undefined,
          geojson: this.#config.hasGeojson ? r.geojson : undefined,
          createdAt: now,
          updatedAt: now,
        };
      } else if (isProvinceValues(r)) {
        return {
          ...r,
          admLevel: this.#config.hasAdmLevel ? r.admLevel : undefined,
          geojson: this.#config.hasGeojson ? r.geojson : undefined,
          createdAt: now,
          updatedAt: now,
        };
      }
      throw new Error("Invalid ADM record to insert");
    });

    const result = await this.collection.insertMany(
      Object.freeze(bsonRecords),
      { session },
    );

    return { insertedCount: result.insertedCount };
  }

  /**
   * Deletes duplicate records from the collection.
   *
   * @param transactionContext - Optional database transaction context.
   * @returns An object containing the number of deleted duplicate rows.
   */
  protected async _deleteDuplicates(transactionContext: DbTransactionContext) {
    const session = ensureIsMongoDbTransactionCtx(transactionContext)
      ? transactionContext.session
      : undefined;

    let groupAggregateIdentifiers: Record<string, `\$${string}`>;
    switch (this.#admLevel) {
      case AdmLevelCode.PROVINCE:
        groupAggregateIdentifiers = {
          province: "$province",
        };
        break;
      case AdmLevelCode.REGION:
        groupAggregateIdentifiers = {
          region: "$region",
        };
        break;
      case AdmLevelCode.DISTRICT:
        groupAggregateIdentifiers = {
          district: "$district",
          region: "$region",
        };
        break;
      case AdmLevelCode.COMMUNE:
        groupAggregateIdentifiers = {
          commune: "$commune",
          district: "$district",
          region: "$region",
        };
        break;
      case AdmLevelCode.FOKONTANY:
        groupAggregateIdentifiers = {
          fokontany: "$fokontany",
          commune: "$commune",
          district: "$district",
          region: "$region",
        };
        break;
      default:
        throw new Error(
          `Unknow ADM level ${this.#admLevel satisfies never} to group by`,
        );
    }
    const idsToDeleteAggregated = await this.collection
      .aggregate<{ idsToDelete: EntityId[] }>(
        [
          {
            $group: {
              _id: groupAggregateIdentifiers,
              keepId: { $first: "$_id" },
              ids: { $push: "$_id" },
              count: { $sum: 1 },
            },
          },
          {
            $match: {
              count: { $gt: 1 },
            },
          },
          {
            $project: {
              idsToDelete: {
                $filter: {
                  input: "$ids",
                  as: "id",
                  cond: { $ne: ["$$id", "$keepId"] },
                },
              },
            },
          },
        ],
        { session },
      )
      .toArray();
    const idsToDelete = idsToDeleteAggregated.flatMap((aggr) =>
      aggr.idsToDelete.map((id) => new ObjectId(id))
    );

    await this.collection.deleteMany({
      _id: { $in: idsToDelete },
    }, { session });
  }

  /**
   * Retrieves multiple administrative entities based on their parent entities' IDs.
   *
   * @param parentsIds - An array of parent entity IDs.
   * @param transactionContext - Optional database transaction context.
   * @returns An array of mapped administrative entities.
   */
  protected async _getManyByParentsIds(
    parentsIds: EntityId[],
    transactionContext?: DbTransactionContext,
  ): Promise<AdmEntity[]> {
    const session = ensureIsMongoDbTransactionCtx(transactionContext)
      ? transactionContext.session
      : undefined;

    const parentIdColumn = `${ADM_LEVEL_TITLE_BY_CODE.get(
      ADM_LEVEL_CODES_INDEXED[ADM_LEVEL_INDEX_BY_CODE.get(this.#admLevel)! - 1],
    )!}Id` as keyof AdmEntityFks;

    const rows = await this.collection
      .find(
        { [parentIdColumn]: { $in: parentsIds.map((id) => new ObjectId(id)) } },
        { session },
      )
      .toArray();

    return rows.map((r) => mapAdmEntityBsonToEntity(r));
  }

  /**
   * Updates a specific field to a given value for multiple records identified by their IDs.
   *
   * @param ids - An array of entity IDs to update.
   * @param column - The field (column) to update.
   * @param value - The new value to set for the specified field.
   * @param transactionContext - Optional database transaction context.
   * @returns An object containing the number of affected rows.
   */
  protected async _updateFieldByIds(
    ids: EntityId[],
    column: string,
    value: string,
    transactionContext?: DbTransactionContext,
  ): Promise<DMLUpdateResult> {
    const session = ensureIsMongoDbTransactionCtx(transactionContext)
      ? transactionContext.session
      : undefined;

    const result = await this.collection
      .updateMany(
        { _id: { $in: ids.map((id) => new ObjectId(id)) } },
        { $set: { [column]: value } },
        { session },
      );

    return { affectedRows: result.modifiedCount };
  }
}
