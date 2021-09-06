import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIError } from 'lib/model/error';
import { DBHoursCumulative } from 'lib/model/meeting';
import { getUser } from 'lib/api/db/user';
import { handle } from 'lib/api/error';
import handleSupabaseError from 'lib/api/db/error';
import segment from 'lib/api/segment';
import supabase from 'lib/api/supabase';
import verifyAuth from 'lib/api/verify/auth';
import { verifyQueryId } from 'lib/api/verify/query-id';

export default async function availability(
  req: Req,
  res: Res<DBHoursCumulative[] | APIError>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const id = verifyQueryId(req.query);
      const user = await getUser(id);
      const { uid, adminOf } = await verifyAuth(req.headers, {
        orgIds: user.orgs,
        userId: user.id,
      });
      const { data, error } = await supabase
        .from<DBHoursCumulative>('hours_cumulative')
        .select()
        .eq('user', user.id)
        .eq('org', user.orgs.find((o) => adminOf?.includes(o)) || user.orgs[0]);
      handleSupabaseError('selecting', 'service hours', user, error);
      if (!data?.length) throw new APIError(`Hours (${user}) not found`, 404);
      res.status(200).json(data);
      segment.track({ userId: uid, event: 'Hours Fetched' });
    } catch (e) {
      handle(e, res);
    }
  }
}
