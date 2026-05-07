import type { DbTransactionContext, TableDDL } from "@scope/types/db";
import type { MadaAdmConfig } from "@scope/types/models";
import { MADA_ADM_CONFIGS_TABLE_NAME_CAMEL_CASED } from "@scope/consts/db";
import type { MongoDbConnection } from "@scope/adapters/mongo";
import { ensureIsMongoDbTransactionCtx } from "@scope/helpers/db";

export class MadaAdmConfigMongoDDL implements TableDDL {
  readonly #dbConnection!: MongoDbConnection;
  readonly tableName = MADA_ADM_CONFIGS_TABLE_NAME_CAMEL_CASED;

  constructor(dbConnection: MongoDbConnection) {
    this.#dbConnection = dbConnection;
  }

  async create(transactionContext?: DbTransactionContext): Promise<void> {
    await this.#dbConnection.db.createCollection(this.tableName, {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [
            "tablesPrefix",
            "isFkRepeated",
            "isProvinceFkRepeated",
            "isProvinceRepeated",
            "hasGeojson",
            "hasAdmLevel",
            "createdAt",
            "updatedAt",
          ] as (keyof MadaAdmConfig)[],
          properties: {
            tablesPrefix: { bsonType: ["string", "null"] },
            isFkRepeated: { bsonType: "bool" },
            isProvinceFkRepeated: { bsonType: "bool" },
            isProvinceRepeated: { bsonType: "bool" },
            hasGeojson: { bsonType: "bool" },
            hasAdmLevel: { bsonType: "bool" },
            createdAt: { bsonType: "date" },
            updatedAt: { bsonType: "date" },
          },
        },
      },
      validationAction: "error",
      validationLevel: "strict",
      session: this.extractSession(transactionContext),
    });
  }

  async drop(transactionContext?: DbTransactionContext): Promise<void> {
    await this.#dbConnection.db.dropCollection(this.tableName, {
      session: this.extractSession(transactionContext),
    });
  }

  exists(transactionContext?: DbTransactionContext): Promise<boolean> {
    const collections = this.#dbConnection.db.listCollections(
      { name: this.tableName },
      {
        session: this.extractSession(transactionContext),
      },
    );
    return collections.hasNext();
  }

  private extractSession(transactionContext?: DbTransactionContext) {
    return ensureIsMongoDbTransactionCtx(transactionContext)
      ? transactionContext.session
      : undefined;
  }
}

let _instance: MadaAdmConfigMongoDDL;

export function injectMadaAdmConfigMongoDDL(dbConnection: MongoDbConnection) {
  if (_instance) return _instance;
  _instance = new MadaAdmConfigMongoDDL(dbConnection);
  return _instance;
}

export function resetMadaAdmConfigMongoDDL() {
  _instance = undefined as unknown as MadaAdmConfigMongoDDL;
}
