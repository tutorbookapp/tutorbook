import { APIError } from 'lib/api/error';
import { Org } from 'lib/model/org';
import supabase from 'lib/api/supabase';

interface DBOrg {
  id: string;
  name: string;
  photo: string | null;
  email: string | null;
  phone: string | null;
  bio: string;
  background: string | null;
  venue: string | null;
  socials: DBSocial[];
  aspects: DBAspect[];
  domains: string[] | null;
  profiles: (keyof DBUser)[];
  subjects: string[] | null;
  signup: object;
  home: object;
  booking: object;
  created: Date;
  updated: Date;
}

interface DBRelationMember {
  user: string;
  org: string;
}

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
