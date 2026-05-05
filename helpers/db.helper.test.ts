// deno-lint-ignore-file
import { assertEquals, assertThrows } from "@std/assert";
import {
  ensureIsMySQLDbTransactionCtx,
  ensureIsPostgresDbTransactionCtx,
  ensureIsSqliteDbTransactionCtx,
} from "./db.helper.ts";
import { DbType } from "@scope/consts/db";
import type {
  DbTransactionContext,
  MySQLTransactionContext,
  PostgresTransactionContext,
  SQLiteTransactionContext,
} from "@scope/types/db";

Deno.test("ensureIsPostgresDbTransactionCtx", async (t) => {
  await t.step("returns false if context is undefined", () => {
    assertEquals(ensureIsPostgresDbTransactionCtx(), false);
  });

  await t.step("returns true if context is Postgres", () => {
    const ctx = {
      dbType: DbType.Postgres,
      tx: {},
    } as PostgresTransactionContext;
    assertEquals(ensureIsPostgresDbTransactionCtx(ctx), true);
  });

  await t.step("throws if context is not Postgres", () => {
    const ctx = { dbType: DbType.SQLite } as unknown as DbTransactionContext;
    assertThrows(
      () => ensureIsPostgresDbTransactionCtx(ctx),
      Error,
      `Transaction context type (${DbType.SQLite}) does not match database type (${DbType.Postgres})`,
    );
  });
});

Deno.test("ensureIsSqliteDbTransactionCtx", async (t) => {
  await t.step("returns false if context is undefined", () => {
    assertEquals(ensureIsSqliteDbTransactionCtx(), false);
  });

  await t.step("returns true if context is SQLite", () => {
    const ctx = {
      dbType: DbType.SQLite,
    } as SQLiteTransactionContext;
    assertEquals(ensureIsSqliteDbTransactionCtx(ctx), true);
  });

  await t.step("throws if context is not SQLite", () => {
    const ctx = { dbType: DbType.Postgres } as unknown as DbTransactionContext;
    assertThrows(
      () => ensureIsSqliteDbTransactionCtx(ctx),
      Error,
      `Transaction context type (${DbType.Postgres}) does not match database type (${DbType.SQLite})`,
    );
  });
});

Deno.test("ensureIsMySQLDbTransactionCtx", async (t) => {
  await t.step("returns false if context is undefined", () => {
    assertEquals(ensureIsMySQLDbTransactionCtx(), false);
  });

  await t.step("returns true if context is MySQL", () => {
    const ctx = {
      dbType: DbType.MySQL,
      connection: {},
    } as unknown as MySQLTransactionContext;
    assertEquals(ensureIsMySQLDbTransactionCtx(ctx), true);
  });

  await t.step("throws if context is not MySQL", () => {
    const ctx = { dbType: DbType.SQLite } as unknown as DbTransactionContext;
    assertThrows(
      () => ensureIsMySQLDbTransactionCtx(ctx),
      Error,
      `Transaction context type (${DbType.SQLite}) does not match database type (${DbType.MySQL})`,
    );
  });
});
