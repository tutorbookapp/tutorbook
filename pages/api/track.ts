import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { v4 as uuid } from 'uuid';

import segment from 'lib/api/segment';

export default function track(req: Req, res: Res<void>): void {
  const { event, href } = req.query as Record<string, string>;
  segment.track({ event, anonymousId: uuid() });
  res.redirect(href);
}
