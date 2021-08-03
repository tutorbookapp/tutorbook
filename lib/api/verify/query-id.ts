import { APIError } from 'lib/model/error';

/**
 * Verifies that the given query object contains an ID param.
 * @param query - The HTTP request query object.
 * @return The ID query param; throws an `APIError` if it wasn't found.
 */
export default function verifyQueryId(query: Record<string, unknown>): string {
  if (typeof query.id !== 'string') {
    const msg = 'Expected query to contain an ID param with type string';
    throw new APIError(msg, 400);
  }
  return query.id;
}
