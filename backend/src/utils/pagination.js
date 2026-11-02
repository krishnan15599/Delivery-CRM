/**
 * Pagination helper for Supabase PostgREST queries.
 * Enforces a sensible max limit (100) and bounds queries even when ?page is omitted
 * to prevent silent 1000-row truncation or unbounded database memory usage.
 */
const applyPagination = (query, { page, pageSize, limit } = {}) => {
  const maxPageSize = 100;
  const isExplicit = page !== undefined || pageSize !== undefined || limit !== undefined;
  const defaultSize = page ? 20 : 50;

  const rawSize = parseInt(pageSize || limit, 10);
  const size = Math.min(
    maxPageSize,
    Math.max(1, Number.isFinite(rawSize) ? rawSize : defaultSize)
  );

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const from = (currentPage - 1) * size;
  const to = from + size - 1;

  return {
    query: query.range(from, to),
    isPaginated: isExplicit,
    page: currentPage,
    pageSize: size,
  };
};

module.exports = {
  applyPagination,
};

