export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

export interface PaginationParams {
  page: number;
  pageSize: number;
  offset: number;
}

/**
 * Validate and normalize pagination parameters.
 */
export function validatePagination(page?: number, pageSize?: number): PaginationParams {
  const validPage = Math.max(1, Math.floor(page ?? 1));
  const validPageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(pageSize ?? DEFAULT_PAGE_SIZE)));
  const offset = (validPage - 1) * validPageSize;

  return { page: validPage, pageSize: validPageSize, offset };
}
