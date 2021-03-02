import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Meeting } from 'lib/model/meeting';
import { MeetingsQuery } from 'lib/model/query/meetings';
import clone from 'lib/utils/clone';
import getMeetings from 'lib/api/get/meetings';
import updateMeetingDoc from 'lib/api/update/meeting-doc';
import updateMeetingSearchObj from 'lib/api/update/meeting-search-obj';

export default async function updateMeetings(
  req: Req,
  res: Res<void>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    const to = new Date();
    const from = new Date(to.valueOf() - 24 * 60 * 60 * 1000);
    const meetings = await getMeetings(new MeetingsQuery({ from, to }));
    await Promise.all(
      meetings.results.map(async (meeting) => {
        if (['pending', 'logged', 'approved'].includes(meeting.status)) return;
        const updated = new Meeting(clone({ ...meeting, status: 'pending' }));
        await Promise.all([
          updateMeetingDoc(updated),
          updateMeetingSearchObj(updated),
        ]);
      })
    );
    res.status(200).end();
  }
}
