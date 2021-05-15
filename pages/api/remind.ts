import { IncomingHttpHeaders } from 'http';

import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIError, handle } from 'lib/api/error';
import { MeetingsQuery } from 'lib/model/query/meetings';
import getMeetings from 'lib/api/get/meetings';
import getPeople from 'lib/api/get/people';
import send1hrReminderEmails from 'lib/mail/meetings/remind/1hr';
import send24hrReminderEmails from 'lib/mail/meetings/remind/24hr';

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
 * GET - Sends a 24-hr reminder for meetings btwn 24 (inclusive) and 25
 *       (non-inclusive) hrs from now AND sends a 1-hr reminder for meetings
 *       btwn 1 (inclusive) and 2 (non-inclusive) hrs from now.
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
      const now = new Date();
      const [meetings1hrAway, meetings24hrsAway] = await Promise.all([
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
      ]);
      await Promise.all([
        ...meetings1hrAway.results.map(async (meeting) => {
          const people = await getPeople(meeting.match.people);
          return send1hrReminderEmails(meeting, people);
        }),
        ...meetings24hrsAway.results.map(async (meeting) => {
          const people = await getPeople(meeting.match.people);
          return send24hrReminderEmails(meeting, people);
        }),
      ]);
      res.status(200).end();
    } catch (e) {
      handle(e, res);
    }
  }
}
