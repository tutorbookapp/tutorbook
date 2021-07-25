import { APIError } from 'lib/api/error';
import { Org } from 'lib/model/org';
import clone from 'lib/utils/clone';
import supabase from 'lib/api/supabase';

export default async function createOrgDoc(org: Org): Promise<Org> {
  const copy: Partial<Org> = clone(org);
  delete copy.members;
  const { error } = await supabase.from('orgs').insert(copy);
  if (error) {
    const msg = `Error saving org (${org.toString()}) in database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  return org;
}
