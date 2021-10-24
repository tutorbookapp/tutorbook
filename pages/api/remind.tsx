import { IncomingHttpHeaders } from 'http';

import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { renderToStaticMarkup } from 'react-dom/server';

import { APIError } from 'lib/model/error';
import Email1 from 'lib/mail/meetings/1hr';
import Email24 from 'lib/mail/meetings/24hr';
import EmailRecur from 'lib/mail/meetings/recur';
import { MeetingsQuery } from 'lib/model/query/meetings';
import { getMeetings } from 'lib/api/db/meeting';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import send from 'lib/mail/send';

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
        meetings1hrInFuture,
        meetings24hrsInFuture,
        meetings1hrInPast,
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
        `Sending ${meetings1hrInFuture.results.length} 1hr reminders, ` +
          `${meetings24hrsInFuture.results.length} 24hr reminders, and ` +
          `${meetings1hrInPast.results.length} donation reminders...`
      );
      await Promise.all([
        ...meetings1hrInFuture.results.map((meeting) => send({
          to: meeting.people.filter((p) => p.email),
          subject: `You’ve got a ${meeting.subjects[0]} lesson today!`,
          html: renderToStaticMarkup(<Email1 meeting={meeting} />),
        })),
        ...meetings24hrsInFuture.results.map(async (meeting) => send({
          to: meeting.people.filter((p) => p.email),
          subject: `You’ve got a ${meeting.subjects[0]} lesson tomorrow!`,
          html: renderToStaticMarkup(<Email24 meeting={meeting} />),
        })),
        ...meetings1hrInPast.results.map(async (meeting) => send({
          to: meeting.people.filter((p) => p.email),
          subject: `Enjoy your ${meeting.subjects[0].toLowerCase()} lesson? Make it recurring!`,
          html: renderToStaticMarkup(<EmailRecur meeting={meeting} />),
        })),
      ]);
      res.status(200).end();
      logger.info('Sent all reminder emails.');
    } catch (e) {
      handle(e, res);
    }
  }
}
