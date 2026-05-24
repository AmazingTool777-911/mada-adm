import { colors } from "@cliffy/ansi/colors";

import { attemptDbConnection, injectDbConnection } from "@scope/db";
import { resolveGlobalCliConfig } from "@scope/helpers/cli";
import type {
  DbConnectionCliConfig,
  GlobalCliConfig,
  GlobalCliConfigResolved,
} from "@scope/types/cli";
import type { DbConnection } from "@scope/types/db";

let isConnected = false;
let dbConnectionPromise:
  | Promise<{
    db: DbConnection;
    config: GlobalCliConfigResolved;
  }>
  | null = null;

export function getDbConnection(): Promise<{
  db: DbConnection;
  config: GlobalCliConfigResolved;
}> {
  if (isConnected && dbConnectionPromise) {
    return dbConnectionPromise;
  }

  isConnected = true;
  dbConnectionPromise = (async () => {
    try {
      const rawConfig: GlobalCliConfig = {
        dbType: Deno.env.get("DB_TYPE"),
        pgUrl: Deno.env.get("PG_URL"),
        pgHost: Deno.env.get("PG_HOST"),
        pgPort: Deno.env.get("PG_PORT")
          ? Number(Deno.env.get("PG_PORT"))
          : undefined,
        pgUser: Deno.env.get("PG_USER"),
        pgPassword: Deno.env.get("PG_PASSWORD"),
        pgDatabase: Deno.env.get("PG_DATABASE"),
        pgSchema: Deno.env.get("PG_SCHEMA"),
        pgSsl: Deno.env.has("PG_SSL")
          ? Deno.env.get("PG_SSL") === "true" || Deno.env.get("PG_SSL") === "1"
          : undefined,
        pgCaCertFile: Deno.env.get("PG_CA_CERT_FILE"),
        pgCaCertPath: Deno.env.get("PG_CA_CERT_PATH"),
        pgConnectionLimit: Deno.env.get("PG_CONNECTION_LIMIT")
          ? Number(Deno.env.get("PG_CONNECTION_LIMIT"))
          : undefined,

        mysqlUrl: Deno.env.get("MYSQL_URL"),
        mysqlHost: Deno.env.get("MYSQL_HOST"),
        mysqlPort: Deno.env.get("MYSQL_PORT")
          ? Number(Deno.env.get("MYSQL_PORT"))
          : undefined,
        mysqlUser: Deno.env.get("MYSQL_USER"),
        mysqlPassword: Deno.env.get("MYSQL_PASSWORD"),
        mysqlDatabase: Deno.env.get("MYSQL_DATABASE"),
        mysqlSsl: Deno.env.has("MYSQL_SSL")
          ? Deno.env.get("MYSQL_SSL") === "true" ||
            Deno.env.get("MYSQL_SSL") === "1"
          : undefined,
        mysqlCaCertFile: Deno.env.get("MYSQL_CA_CERT_FILE"),
        mysqlCaCertPath: Deno.env.get("MYSQL_CA_CERT_PATH"),
        mysqlCertFile: Deno.env.get("MYSQL_CERT_FILE"),
        mysqlCertPath: Deno.env.get("MYSQL_CERT_PATH"),
        mysqlKeyFile: Deno.env.get("MYSQL_KEY_FILE"),
        mysqlKeyPath: Deno.env.get("MYSQL_KEY_PATH"),
        mysqlConnectionLimit: Deno.env.get("MYSQL_CONNECTION_LIMIT")
          ? Number(Deno.env.get("MYSQL_CONNECTION_LIMIT"))
          : undefined,

        sqliteDbFile: Deno.env.get("SQLITE_DB_FILE"),
        sqliteDbPath: Deno.env.get("SQLITE_DB_PATH"),

        mongoUri: Deno.env.get("MONGO_URI"),
        mongoPoolSize: Deno.env.get("MONGO_POOL_SIZE")
          ? Number(Deno.env.get("MONGO_POOL_SIZE"))
          : undefined,
        mongoDatabase: Deno.env.get("MONGO_DATABASE"),
        mongoTls: Deno.env.has("MONGO_TLS")
          ? Deno.env.get("MONGO_TLS") === "true" ||
            Deno.env.get("MONGO_TLS") === "1"
          : undefined,
        mongoTlsCaFile: Deno.env.get("MONGO_TLS_CA_FILE"),
        mongoTlsCaPath: Deno.env.get("MONGO_TLS_CA_PATH"),
        mongoTlsCertKeyFile: Deno.env.get("MONGO_TLS_CERT_KEY_FILE"),
        mongoTlsCertKeyPath: Deno.env.get("MONGO_TLS_CERT_KEY_PATH"),
        mongoTlsCertPassword: Deno.env.get("MONGO_TLS_CERT_PASSWORD"),
        mongoTlsAllowInvalidCertificates: Deno.env.has(
            "MONGO_TLS_ALLOW_INVALID_CERTIFICATES",
          )
          ? Deno.env.get("MONGO_TLS_ALLOW_INVALID_CERTIFICATES") === "true" ||
            Deno.env.get("MONGO_TLS_ALLOW_INVALID_CERTIFICATES") === "1"
          : undefined,
        mongoTlsAllowInvalidHostnames: Deno.env.has(
            "MONGO_TLS_ALLOW_INVALID_HOSTNAMES",
          )
          ? Deno.env.get("MONGO_TLS_ALLOW_INVALID_HOSTNAMES") === "true" ||
            Deno.env.get("MONGO_TLS_ALLOW_INVALID_HOSTNAMES") === "1"
          : undefined,
      };

      const resolvedConfig = resolveGlobalCliConfig(rawConfig);

      const config: DbConnectionCliConfig = {
        dbType: resolvedConfig.dbType,
        pg: resolvedConfig.pg,
        mysql: resolvedConfig.mysql,
        sqlite: resolvedConfig.sqlite,
        mongo: resolvedConfig.mongo,
      };

      console.log(
        colors.blue(`\n🔌 Establishing database connection for REST API...`),
      );
      const db = await injectDbConnection(config.dbType);
      await attemptDbConnection(db, config);
      console.log(
        colors.green.bold(
          `✅ Database connection established successfully!\n`,
        ),
      );

      return { db, config: resolvedConfig };
    } catch (error) {
      console.error(
        colors.red.bold("❌ Failed to connect to database for REST API!"),
      );
      console.error(colors.red(String(error)));
      isConnected = false;
      dbConnectionPromise = null;
      throw error;
    }
  })();

  return dbConnectionPromise;
}
