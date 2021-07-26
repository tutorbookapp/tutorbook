import { APIError } from 'lib/api/error';
import { Org } from 'lib/model/org';
import supabase from 'lib/api/supabase';

export default async function getOrg(id: string): Promise<Org> {
  const { data } = await supabase.from<Org>('orgs').select().eq('id', id);
  if (!data || !data[0])
    throw new APIError(`Org (${id}) does not exist in database`);
  const { data: members } = await supabase
    .from<{ user: string; org: string }>('relation_members')
    .select('user')
    .eq('org', id);
  const org = Org.parse(data[0]);
  org.members = (members || []).map((m) => m.user);
  return org;
}
