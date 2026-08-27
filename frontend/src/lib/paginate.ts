import type { PaginatedResult } from "../api/types";

/** Empacota um array já carregado no formato PaginatedResult usado pelas telas (compatibilidade com a API antiga). */
export function paginate<T>(items: T[], page = 1, limit?: number): PaginatedResult<T> {
  return { items, total: items.length, page, limit: limit ?? items.length, hasMore: false };
}
