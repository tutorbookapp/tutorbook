import { IncomingHttpHeaders } from 'http';

import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIError } from 'lib/model/error';
import { MeetingsQuery } from 'lib/model/query/meetings';
import { getMeetings } from 'lib/api/db/meeting';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import mail1hr from 'lib/mail/meetings/1hr';
import mail24hr from 'lib/mail/meetings/24hr';
import mailRecur from 'lib/mail/meetings/recur';

function verifyAuth(headers: IncomingHttpHeaders): void {
  if (typeof headers.authorization !== 'string')
    throw new APIError('You must provide a valid authorization header', 401);
  if (!headers.authorization.startsWith('Bearer '))
    throw new APIError('Your authorization header must use a JWT', 401);
  const token = headers.authorization.replace('Bearer ', '');
  if (token !== process.env.REMIND_TOKEN)
    throw new APIError('Your authorization token is invalid', 401);
}

/**
 * Sends meeting reminder emails:
 * - A 24-hr reminder for meetings btwn 24 (inclusive) and 25 (non-inclusive)
 *   hrs from now.
 * - A 1-hr reminder for meetings btwn 1 (inclusive) and 2 (non-inclusive) hrs
 *   from now.
 *
 * And sends emails after meetings:
 * - A donation reminder to parents/students for meetings that ended btwn 0
 *   (inclusive) and 1 (non-inclusive) hrs ago.
 * - A "make this meeting recurring" reminder to volunteers for non-recurring
 *   meetings that ended btwn 0 (inclusive) and 1 (non-inclusive) hrs ago.
 *
 * Requires a special authentication token only known to our CRON job.
 * This endpoint is "hit" every hour by a GCP scheduled CRON job.
 */
export default async function remind(req: Req, res: Res): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      verifyAuth(req.headers);
      const { time } = req.query;
      const now = typeof time === 'string' ? new Date(time) : new Date();
      logger.verbose(`Fetching meetings from ${now.toString()}...`);
      logger.verbose(
        `Fetching meetings from ${new Date(
          now.valueOf() + 1 * 60 * 60 * 1000
        ).toString()}...`
      );
      logger.verbose(
        `Fetching meetings from ${new Date(
          now.valueOf() + 24 * 60 * 60 * 1000
        ).toString()}...`
      );
      logger.verbose(
        `Fetching meetings from ${new Date(
          now.valueOf() - 1 * 60 * 60 * 1000 + 1
        ).toString()}...`
      );
      const [
        mtgs1hrInFuture,
        mtgs24hrsInFuture,
        mtgs1hrInPast,
      ] = await Promise.all([
        getMeetings(
          new MeetingsQuery({
            from: new Date(now.valueOf() + 1 * 60 * 60 * 1000),
            to: new Date(now.valueOf() + 2 * 60 * 60 * 1000 - 1),
          })
        ),
        getMeetings(
          new MeetingsQuery({
            from: new Date(now.valueOf() + 24 * 60 * 60 * 1000),
            to: new Date(now.valueOf() + 25 * 60 * 60 * 1000 - 1),
          })
        ),
        getMeetings(
          new MeetingsQuery({
            org: 'quarantunes', // TODO: Make this configured in org doc.
            from: new Date(now.valueOf() - 1 * 60 * 60 * 1000 + 1),
            to: now,
          })
        ),
      ]);
      logger.info(
        `Sending ${mtgs1hrInFuture.results.length} 1hr reminders, ` +
          `${mtgs24hrsInFuture.results.length} 24hr reminders, and ` +
          `${mtgs1hrInPast.results.length} donation reminders...`
      );
      await Promise.all([
        ...mtgs1hrInFuture.results.map(mail1hr),
        ...mtgs24hrsInFuture.results.map(mail24hr),
        ...mtgs1hrInPast.results.filter((m) => !m.time.recur).map(mailRecur),
      ]);
      res.status(200).end();
      logger.info('Sent all reminder emails.');
    } catch (e) {
      handle(e, res);
    }
  }
}
