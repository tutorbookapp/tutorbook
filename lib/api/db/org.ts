import { APIError } from 'lib/api/error';
import { Org } from 'lib/model/org';
import clone from 'lib/utils/clone';
import supabase from 'lib/api/supabase';

export default async function createOrgDoc(org: Org): Promise<Org> {
  const copy: Partial<Org> = clone(org);
  delete copy.members;
  const { error } = await supabase.from('orgs').insert(copy);
  if (error) {
    const msg = `Error saving org (${org.name}) in database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  const members = org.members.map((m) => ({ user: m, org: org.id }));
  const { error: e } = await supabase.from('relation_members').insert(members);
  if (e) {
    const msg = `Error saving members for org (${org.name}) in database`;
    throw new APIError(`${msg}: ${e.message}`, 500);
  }
  return org;
}
