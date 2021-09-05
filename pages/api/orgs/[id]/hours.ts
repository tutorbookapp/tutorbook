import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIError } from 'lib/model/error';
import { DBTotalHours } from 'lib/model/user';
import { handle } from 'lib/api/error';
import handleSupabaseError from 'lib/api/db/error';
import segment from 'lib/api/segment';
import supabase from 'lib/api/supabase';
import verifyAuth from 'lib/api/verify/auth';
import { verifyQueryId } from 'lib/api/verify/query-id';

export default async function hours(
  req: Req,
  res: Res<DBTotalHours[]>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const id = verifyQueryId(req.query);
      const { uid } = await verifyAuth(req.headers, { orgIds: [id] });
      const { data, error } = await supabase
        .from<DBTotalHours>('hours_total')
        .select()
        .eq('org', id)
        .order('hours', { ascending: false });
      handleSupabaseError('selecting', 'org service hours', id, error);
      if (!data?.length) throw new APIError(`Hours (${id}) not found`, 404);
      res.status(200).json(data);
      segment.track({ userId: uid, event: 'Hours Fetched' });
    } catch (e) {
      handle(e, res);
    }
  }
}
