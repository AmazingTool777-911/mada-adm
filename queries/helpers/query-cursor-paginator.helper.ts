import type * as z from "@zod/zod";

import type { MaybePromise } from "@scope/types/utils";
import * as jsonBase64Helper from "@scope/helpers/json-base64";
import type {
  CursorPaginatedResult,
  CursorPaginationParams,
} from "../queries.d.ts";

export type QueryCursorPaginatorOptions<TCursor, TRecord, TQueryParams> = {
  toCursor: (record: TRecord) => TCursor;
  queryFn: (
    paginationParams: CursorPaginationParams<TCursor>,
    queryParams?: TQueryParams,
  ) => MaybePromise<TRecord[]>;
  cursorEncodedSchema?: z.ZodSchema<TCursor>;
};

export class QueryCursorPaginator<
  TCursor,
  TRecord,
  TQueryParams = Record<string, unknown>,
> {
  private toCursor!: (record: TRecord) => TCursor;

  private queryFn!: (
    paginationParams: CursorPaginationParams<TCursor>,
    queryParams?: TQueryParams,
  ) => MaybePromise<TRecord[]>;

  private cursorEncodedSchema?: z.ZodSchema<TCursor>;

  constructor(
    options: QueryCursorPaginatorOptions<TCursor, TRecord, TQueryParams>,
  ) {
    this.toCursor = options.toCursor;
    this.queryFn = options.queryFn;
    this.cursorEncodedSchema = options.cursorEncodedSchema;
  }

  async query(
    paginationParams: CursorPaginationParams<TCursor>,
    queryParams?: TQueryParams,
  ): Promise<CursorPaginatedResult<TCursor, TRecord>> {
    const { limit, cursor, cursorEncoded, encodeCursor } = paginationParams;

    let actualCursor!: TCursor | null;
    if (cursor) {
      actualCursor = cursor;
    } else if (cursorEncoded) {
      const cursorDecoded = jsonBase64Helper.decodeToJsonObject<TCursor>(
        cursorEncoded,
      );
      actualCursor = this.cursorEncodedSchema
        ? this.cursorEncodedSchema.parse(cursorDecoded)
        : cursorDecoded;
    } else {
      actualCursor = null;
    }

    const records = await this.queryFn(
      { limit: limit + 1, cursor: actualCursor },
      queryParams,
    );

    const next = records.length > limit ? this.toCursor(records.at(-1)!) : null;

    records.splice(-1, 1);

    const result: CursorPaginatedResult<TCursor, TRecord> = {
      records,
      limit,
      current: cursor ?? null,
      next,
    };
    if (encodeCursor) {
      if (result.current) {
        result.currentEncoded = jsonBase64Helper.encodeToBase64(
          result.current!,
        );
      }
      if (next) {
        result.nextEncoded = jsonBase64Helper.encodeToBase64(next);
      }
    }

    return result;
  }
}
