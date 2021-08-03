import { period } from 'lib/utils';

export interface APIErrorJSON {
  message: string;
  code: number;
}

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
    super(period(message));
  }

  public toJSON(): APIErrorJSON {
    return { message: this.message, code: this.code };
  }

  public static fromJSON(json: APIErrorJSON): APIError {
    return new APIError(json.message, json.code);
  }
}
