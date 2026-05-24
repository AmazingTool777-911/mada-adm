import type { MaybePromise } from "@scope/types/utils";
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

  constructor(
    options: QueryCursorPaginatorOptions<TCursor, TRecord, TQueryParams>,
  ) {
    this.toCursor = options.toCursor;
    this.queryFn = options.queryFn;
  }

  async query(
    paginationParams: CursorPaginationParams<TCursor>,
    queryParams?: TQueryParams,
  ): Promise<CursorPaginatedResult<TCursor, TRecord>> {
    const { limit, cursor } = paginationParams;
    const records = await this.queryFn(
      { limit: limit + 1, cursor },
      queryParams,
    );
    const next = records.length > limit ? this.toCursor(records.at(-1)!) : null;
    records.splice(-1, 1);
    return {
      records,
      limit,
      current: cursor,
      next,
    };
  }
}
