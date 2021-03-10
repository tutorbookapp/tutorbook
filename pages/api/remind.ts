import { IncomingHttpHeaders } from 'http';

import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIError, handle } from 'lib/api/error';
import { MeetingsQuery } from 'lib/model/query/meetings';
import getMeetings from 'lib/api/get/meetings';
import getPeople from 'lib/api/get/people';
import sendEmails from 'lib/mail/meetings/remind';

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
 * GET - Sends reminders to people who have meetings within the next 24 hours.
 *
 * Requires a special authentication token only known to our CRON job.
 */
export default async function remind(req: Req, res: Res): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      verifyAuth(req.headers);
      const from = new Date();
      const to = new Date(from.valueOf() + 864e5);
      const meetings = await getMeetings(new MeetingsQuery({ from, to }));
      await Promise.all(
        meetings.results.map(async (meeting) => {
          const people = await getPeople(meeting.match.people);
          return sendEmails(meeting, people);
        })
      );
      res.status(200).end();
    } catch (e) {
      handle(e, res);
    }
  }
}
