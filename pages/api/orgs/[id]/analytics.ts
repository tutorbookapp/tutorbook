import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIError } from 'lib/model/error';
import { handle } from 'lib/api/error';
import segment from 'lib/api/segment';
import supabase from 'lib/api/supabase';
import verifyAuth from 'lib/api/verify/auth';
import { verifyQueryId } from 'lib/api/verify/query-id';

export interface DBUsersWithMeetings {
  week: string;
  users: number;
  growth: number;
}

export interface DBUsers {
  week: string;
  users: number;
  growth: number;
  total: number;
  total_growth: number;
}

export interface DBMeetings {
  week: string;
  meetings: number;
  growth: number;
  total: number;
}

export interface DBServiceHours {
  week: string;
  hours: number;
  growth: number;
  total: number;
}

export interface AnalyticsRes {
  usersWithMeetings: DBUsersWithMeetings[];
  users: DBUsers[];
  meetings: DBMeetings[];
  serviceHours: DBServiceHours[];
}

export default async function analyticsAPI(
  req: Req,
  res: Res<AnalyticsRes | APIError>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const id = verifyQueryId(req.query);
      const { uid } = await verifyAuth(req.headers, { orgIds: [id] });
      // TODO: Get user's timezone from request or their profile.
      const props = { org_id: id, timezone: 'America/Los_Angeles' };
      const [
        { data: usersWithMeetings, error: usersWithMeetingsError },
        { data: users, error: usersError },
        { data: meetings, error: meetingsError },
        { data: serviceHours, error: serviceHoursError },
      ] = await Promise.all([
        supabase.rpc<DBUsersWithMeetings>('users_with_meetings', props),
        supabase.rpc<DBUsers>('users', props),
        supabase.rpc<DBMeetings>('meetings', props),
        supabase.rpc<DBServiceHours>('service_hours', props),
      ]);
      if (usersWithMeetingsError || !usersWithMeetings) {
        const msg = 'Error fetching "users_with_meetings" analytics';
        throw new APIError(`${msg}: ${usersWithMeetingsError?.message}`, 500);
      }
      if (usersError || !users) {
        const msg = 'Error fetching "users" analytics';
        throw new APIError(`${msg}: ${usersError?.message}`, 500);
      }
      if (meetingsError || !meetings) {
        const msg = 'Error fetching "meetings" analytics';
        throw new APIError(`${msg}: ${meetingsError?.message}`, 500);
      }
      if (serviceHoursError || !serviceHours) {
        const msg = 'Error fetching "service_hours" analytics';
        throw new APIError(`${msg}: ${serviceHoursError?.message}`, 500);
      }
      res.status(200).json({
        usersWithMeetings,
        users,
        meetings,
        serviceHours,
      });
      segment.track({ userId: uid, event: 'Analytics Fetched' });
    } catch (e) {
      handle(e, res);
    }
  }
}
