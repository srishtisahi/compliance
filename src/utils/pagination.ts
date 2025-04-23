import { PaginationParams } from '../types/api.types';

/**
 * Default pagination values
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Parse pagination parameters from request query
 * @param params Pagination parameters from request
 * @returns Normalized pagination parameters
 */
export const parsePaginationParams = (params: PaginationParams): {
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
} => {
  // Parse page and limit with defaults
  const page = Math.max(1, Number(params.page) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(params.limit) || DEFAULT_LIMIT));
  
  // Calculate skip for MongoDB
  const skip = (page - 1) * limit;
  
  // Parse sort parameters
  const sortBy = params.sortBy || 'createdAt';
  const sortDirection = params.sortDirection === 'asc' ? 1 : -1;
  
  // Create sort object for MongoDB
  const sort: Record<string, 1 | -1> = { [sortBy]: sortDirection };
  
  return { page, limit, skip, sort };
};

/**
 * Create pagination metadata for response
 * @param total Total number of items
 * @param page Current page
 * @param limit Items per page
 * @returns Pagination metadata
 */
export const createPaginationMetadata = (total: number, page: number, limit: number) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}; 