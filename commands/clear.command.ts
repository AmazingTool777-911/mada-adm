import { colors } from "@cliffy/ansi/colors";
import { Command } from "@cliffy/command";
import { Confirm } from "@cliffy/prompt";

import {
  CLEAR_COMMAND_DESCRIPTION,
  CLEAR_COMMAND_NAME,
} from "@scope/consts/cli";
import { DDL_TRANSACTION_OPTIONS } from "@scope/consts/db";
import {
  injectCommunesDDL,
  injectDbConnection,
  injectDistrictsDDL,
  injectFokontanysDDL,
  injectMadaAdmConfigDML,
  injectProvincesDDL,
  injectRegionsDDL,
} from "@scope/db";
import { injectMadaAdmConfigDDL } from "@scope/db/ddl";
import {
  displayMadaAdmConfig,
  resolveCommonGlobalCliConfig,
} from "@scope/helpers/cli";
import type { GlobalCliConfig } from "@scope/types/cli";
import type { DbConnection } from "@scope/types/db";

/**
 * CLI sub-command that drops all ADM tables and the configuration table from
 * the database, effectively resetting the Mada ADM state.
 */
export class CliClearCommand extends Command<GlobalCliConfig, void> {
  /**
   * Initializes the clear sub-command with its name, description, and action
   * handler.
   */
  constructor() {
    super();
    this
      .name(CLEAR_COMMAND_NAME)
      .description(CLEAR_COMMAND_DESCRIPTION)
      .action(async (options) => {
        try {
          await this.handleClear(options);
        } catch (error) {
          console.error(
            `\n${colors.red("❌ Error:")} ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          Deno.exit(1);
        }
      });
  }

  /**
   * Main handler: checks for an existing ADM config, drops ADM tables if they
   * exist, then drops the config table.
   *
   * @param options - The globally resolved CLI configuration.
   */
  private async handleClear(options: GlobalCliConfig): Promise<void> {
    let db!: DbConnection;

    try {
      const { dbType, pgSchema } = resolveCommonGlobalCliConfig(options);

      db = injectDbConnection(dbType);

      const madaAdmConfigDDL = injectMadaAdmConfigDDL(dbType, db, {
        pgSchema,
      });
      const madaAdmConfigDML = injectMadaAdmConfigDML(dbType, db, {
        pgSchema,
      });

      // ── 1. Check for existing config ──────────────────────────────────────

      const configTableExists = await madaAdmConfigDDL.exists();
      if (!configTableExists) {
        console.log(
          colors.yellow(
            `ℹ️  No Mada ADM configuration found in the database. Nothing to clear.\n`,
          ),
        );
        return;
      }

      const existingConfig = await madaAdmConfigDML.get();
      if (!existingConfig) {
        console.log(
          colors.yellow(
            `ℹ️  No Mada ADM configuration found in the database. Nothing to clear.\n`,
          ),
        );
        return;
      }

      displayMadaAdmConfig("Current ADM Configuration", existingConfig);

      // ── 2. Confirm before proceeding ──────────────────────────────────────

      console.log(
        colors.yellow(
          `⚠️  This will permanently delete all ADM tables and the configuration table from the database.\n`,
        ),
      );

      const confirmed = await Confirm.prompt({
        message: "Are you sure you want to clear all Mada ADM data?",
        default: false,
      });

      if (!confirmed) {
        console.log(colors.gray(`ℹ️  Operation cancelled.\n`));
        return;
      }

      // ── 3. Drop ADM tables if they exist ──────────────────────────────────

      const provincesDDL = injectProvincesDDL(
        existingConfig,
        dbType,
        db,
        { pgSchema },
      );
      const regionsDDL = injectRegionsDDL(
        existingConfig,
        dbType,
        db,
        { pgSchema },
      );
      const districtsDDL = injectDistrictsDDL(
        existingConfig,
        dbType,
        db,
        { pgSchema },
      );
      const communesDDL = injectCommunesDDL(
        existingConfig,
        dbType,
        db,
        { pgSchema },
      );
      const fokontanysDDL = injectFokontanysDDL(
        existingConfig,
        dbType,
        db,
        { pgSchema },
      );

      const admTablesExist = (
        await Promise.all([
          provincesDDL.exists(),
          regionsDDL.exists(),
          districtsDDL.exists(),
          communesDDL.exists(),
          fokontanysDDL.exists(),
        ])
      ).some((exists) => exists);

      if (admTablesExist) {
        console.log(
          colors.red(`🗑️  Dropping ADM tables...`),
        );
        await db.transaction(
          async (txCtx) => {
            for (
              const ddl of [
                fokontanysDDL,
                communesDDL,
                districtsDDL,
                regionsDDL,
                provincesDDL,
              ]
            ) {
              console.log(`   Dropping the ${ddl.tableName} table ...`);
              await ddl.drop(txCtx);
            }
          },
          DDL_TRANSACTION_OPTIONS,
        );
        console.log(colors.green(`✅ ADM tables dropped successfully.\n`));
      } else {
        console.log(
          colors.gray(`ℹ️  No ADM tables found. Skipping table deletion.\n`),
        );
      }

      // ── 4. Drop the config table ───────────────────────────────────────────

      const dropConfigTable = await Confirm.prompt({
        message: "Do you also want to drop the Mada ADM configuration table?",
        default: true,
      });

      if (dropConfigTable) {
        console.log(
          colors.red(`🗑️  Dropping Mada ADM configuration table...`),
        );
        await madaAdmConfigDDL.drop();
        console.log(
          colors.bold.green(
            `✅ Mada ADM configuration table dropped successfully.\n`,
          ),
        );
      } else {
        console.log(
          colors.gray(`ℹ️  Mada ADM configuration table kept.\n`),
        );
      }

      console.log(
        colors.bold.green(`✨ Clear operation completed.\n`),
      );
    } finally {
      await db.close();
      console.log(colors.gray("🔌 Database connection closed successfully"));
    }
  }
}

let _command: CliClearCommand | null = null;

/**
 * Returns the singleton instance of {@link CliClearCommand},
 * creating it on first call.
 */
export function injectCliClearCommand(): CliClearCommand {
  if (!_command) _command = new CliClearCommand();
  return _command;
}
