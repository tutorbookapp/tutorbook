import { ServerResponse } from 'http';

import { APIError } from 'lib/model/error';
import logger from 'lib/api/logger';
import { period } from 'lib/utils';

function send(e: APIError, res: ServerResponse): void {
  logger.error(`API encountered (${e.code}) error: ${e.message}`);
  const stringified = JSON.stringify(e);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(stringified));
  res.statusCode = e.code;
  res.end(stringified);
}

export function handle(e: unknown, res: ServerResponse): void {
  if (e instanceof APIError) return send(e, res);
  if (e instanceof Error) return send(new APIError(e.message, 500), res);
  if (typeof e === 'string') return send(new APIError(e, 500), res);
  return send(new APIError('Unknown error', 500), res);
}
