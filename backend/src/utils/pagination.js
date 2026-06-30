'use strict';

/**
 * pagination.js
 *
 * Shared pagination helpers.
 * Provides consistent page/limit parsing and response envelope
 * construction across all list endpoints.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse and sanitize pagination parameters from the request query string.
 *
 * @param {object} query - Express req.query object
 * @returns {{ page: number, limit: number, skip: number }}
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT),
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Build a standardised pagination envelope for list responses.
 *
 * @param {Array}   data  - The page of records to return
 * @param {number}  total - Total record count (from COUNT query)
 * @param {number}  page  - Current page number
 * @param {number}  limit - Records per page
 * @returns {object}
 */
function buildPaginatedResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

module.exports = { parsePagination, buildPaginatedResponse };
