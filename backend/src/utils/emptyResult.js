const { applyPagination } = require('./pagination');

/**
 * List result for a user whose scope contains nothing (e.g. a Manager with
 * no teams), shaped exactly like a real paginated/unpaginated list result.
 */
const emptyListResult = ({ page, pageSize, limit } = {}) => {
  const fakeQuery = { range: () => fakeQuery };
  const { isPaginated, page: curPage, pageSize: curSize } = applyPagination(fakeQuery, { page, pageSize, limit });
  return { data: [], count: 0, isPaginated, page: curPage, pageSize: curSize };
};

module.exports = { emptyListResult };
