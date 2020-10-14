import { NextApiResponse as Res } from 'next';

/**
 * Custom `Error` class that contains an HTTP status code property.
 * @typedef {Object} APIError
 * @property code - The HTTP status code for this error (e.g. 401 or 500).
 * @todo Add i18n to human-readable error codes.
 * @todo Replace `code` with `status` and add a string `code` property that
 * allows our front-end to know exactly what error has occurred (e.g. a `code`
 * indicating that the user's JWT is invalid could be `auth/no-jwt`).
 */
export class APIError extends Error {
  public constructor(message: string, public readonly code: number = 400) {
    super(message);
  }
}

export function handle(e: unknown, res: Res): void {
  if (e instanceof APIError) res.status(e.code).end(e.message);
  if (e instanceof Error) res.status(500).end(e.message);
  if (typeof e === 'string') res.status(500).end(e);
}
