import { APIError } from 'lib/api/error';
import { Org } from 'lib/model/org';
import clone from 'lib/utils/clone';
import supabase from 'lib/api/supabase';

export default async function updateOrgDoc(org: Org): Promise<Org> {
  const copy: Partial<Org> = clone(org);
  delete copy.members;
  const { error } = await supabase.from('orgs').upsert(copy).eq('id', org.id);
  if (error) {
    const msg = `Error updating org (${org.toString()}) in database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  return org;
}
