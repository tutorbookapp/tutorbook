import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import fallbackTimeline from 'components/analytics/data';

import { APIError, handle } from 'lib/api/error';
import { Analytics } from 'lib/model/analytics';
import { db } from 'lib/api/firebase';
import segment from 'lib/api/segment';
import verifyAuth from 'lib/api/verify/auth';
import verifyQueryId from 'lib/api/verify/query-id';

/**
 * @typedef {Object} AnalyticsSnapshot
 * @description Snapshot of analytics at a given point in time.
 * @property date - The date in milliseconds form.
 * @property volunteers - Total number of volunteers.
 * @property students - Total number of students.
 * @property matches - Total number of matches.
 * @property meetings - Total number of meetings.
 */
export interface AnalyticsSnapshot {
  date: number;
  volunteers: number;
  students: number;
  matches: number;
  meetings: number;
}

/**
 * @typedef {Object} AnalyticsRes
 * @description Data that powers the org overview page. Calculated based on the
 * `Analytics` objects stored in the `/org/<orgId>/analytics` subcollection.
 */
export interface AnalyticsRes {
  volunteers: { change: number; total: number; matched: number };
  students: { change: number; total: number; matched: number };
  matches: { change: number; total: number; meeting: number };
  meetings: { change: number; total: number; recurring: number };
  timeline: AnalyticsSnapshot[];
}

/**
 * Calculates in percent, the change between 2 numbers.
 * e.g from 1000 to 500 = 50%
 *
 * @param oldNumber - The initial value.
 * @param newNumber - The value that changed.
 */
function getPercentChange(oldNumber: number, newNumber: number): number {
  const decreaseValue = oldNumber - newNumber;
  return (decreaseValue / oldNumber) * 100;
}

/**
 * GET - Fetches the data for the org's overview page.
 *
 * Requires an authentication JWT belonging to a member of the org in question.
 */
export default async function analytics(
  req: Req,
  res: Res<APIError | AnalyticsRes>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    res.status(200).json({
      volunteers: { change: 12.5, total: 258, matched: 189 },
      students: { change: 12.5, total: 218, matched: 218 },
      matches: { change: -2.3, total: 443, meeting: 413 },
      meetings: { change: 32.5, total: 5425, recurring: 546 },
      timeline: fallbackTimeline,
    });

    try {
      // Get last six months of data from the analytics subcollection.
      const orgId = verifyQueryId(req.query);
      const { uid } = await verifyAuth(req.headers, { orgIds: [orgId] });
      const { docs } = await db
        .collection('orgs')
        .doc(orgId)
        .collection('analytics')
        .orderBy('created', 'desc')
        .where('created', '>=', new Date().valueOf() - 157788e5)
        .get();

      // Analytics snapshots going backwards in time (i.e. latest first).
      const timeline = docs
        .map(Analytics.fromFirestoreDoc)
        .sort((a, b) => b.created.valueOf() - a.created.valueOf());

      // Calculate the percent change from last week's data (i.e. the latest
      // data from at least a week ago).
      const current = timeline[0];
      const lastWeekDate = new Date().valueOf() - 6048e5;
      const lastWeek =
        timeline.find((d) => d.created.valueOf() <= lastWeekDate) || current;

      res.status(200).json({
        volunteers: {
          change: getPercentChange(
            lastWeek.volunteer.total,
            current.volunteer.total
          ),
          total: current.volunteer.total,
          matched: current.volunteer.matched,
        },
        students: {
          change: getPercentChange(
            lastWeek.student.total,
            current.student.total
          ),
          total: current.student.total,
          matched: current.student.matched,
        },
        matches: {
          change: getPercentChange(lastWeek.match.total, current.match.total),
          total: current.match.total,
          meeting: current.match.meeting,
        },
        meetings: {
          change: getPercentChange(
            lastWeek.meeting.total,
            current.meeting.total
          ),
          total: current.meeting.total,
          recurring: current.meeting.recurring,
        },
        timeline: timeline.reverse().map((a) => ({
          date: a.created.valueOf(),
          volunteers: a.volunteer.total,
          students: a.student.total,
          matches: a.match.total,
          meetings: a.meeting.total,
        })),
      });

      segment.track({ userId: uid, event: 'Analytics Fetched' });
    } catch (e) {
      handle(e, res);
    }
  }
}