import {
  DEFAULT_ADM_ENTITIES_PAGINATION_LIMIT,
  MAX_ADM_ENTITIES_PAGINATION_LIMIT,
} from "../consts/pagination.consts.ts";

export function parseLimitQueryParam(limit?: string) {
  const numLimit = limit
    ? Number(limit)
    : DEFAULT_ADM_ENTITIES_PAGINATION_LIMIT;
  return Math.min(numLimit, MAX_ADM_ENTITIES_PAGINATION_LIMIT);
}
