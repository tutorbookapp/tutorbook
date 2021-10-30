import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Subject } from 'lib/model/subject';
import { SubjectsQuery } from 'lib/model/query/subjects';
import { handle } from 'lib/api/error';
import handleSupabaseError from 'lib/api/db/error';
import supabase from 'lib/api/supabase';

export default async function account(req: Req, res: Res<Subject[]>): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const query = SubjectsQuery.params(req.query as Record<string, string>);
      const { data, error } = await supabase
        .from<Subject>('subjects')
        .select()
        .ilike('name', `%${query.search}%`);
      handleSupabaseError('getting', 'subjects', query, error);
      res.status(200).json(data || []);
    } catch (e) {
      handle(e, res);
    }
  }
}
