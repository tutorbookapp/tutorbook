import { NextApiResponse } from 'next';

export default function error(
  res: NextApiResponse,
  msg: string,
  code = 400,
  err?: Error
): void {
  console.error(`[ERROR] Sending client ${code} with msg (${msg})...`, err);
  res.status(code).send({ msg, ...(err || {}) });
}
