/**
 * Input sanitization and formatting utilities
 */

/**
 * Sanitize search strings intended for PostgREST .or() filters.
 * Commas, parentheses, quotes, and percent signs alter the PostgREST filter structure.
 * Strips special characters and collapses whitespace.
 */
const sanitizeSearchQuery = (query) => {
  if (query === undefined || query === null) return '';
  const str = String(query);
  // Remove PostgREST operator characters and delimiters: , ( ) % * " ' \
  const cleaned = str.replace(/[,()%"'\\*]/g, ' ').trim().replace(/\s+/g, ' ');
  return cleaned;
};

/**
 * Safely converts value to a trimmed string or null.
 * Prevents TypeError when numeric values (e.g., pincode: 560038) are passed.
 */
const safeTrim = (val) => {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  return str.length > 0 ? str : null;
};

/**
 * Normalizes an end-date string so that it includes the entire day.
 * If provided as YYYY-MM-DD, returns YYYY-MM-DDT23:59:59.999Z.
 */
const normalizeEndDate = (dateStr) => {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  // Check if dateStr is simple YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return `${str}T23:59:59.999Z`;
  }
  return str;
};

module.exports = {
  sanitizeSearchQuery,
  safeTrim,
  normalizeEndDate,
};

