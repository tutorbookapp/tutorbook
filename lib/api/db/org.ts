import { DBOrg, DBRelationMember, Org } from 'lib/model/org';
import { APIError } from 'lib/api/error';
import supabase from 'lib/api/supabase';

export async function createOrg(org: Org): Promise<Org> {
  const { error } = await supabase.from<DBOrg>('orgs').insert(org.toDB());
  if (error) {
    const msg = `Error saving org (${org.name}) in database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  const members = org.members.map((m) => ({ user: m, org: org.id }));
  const { error: e } = await supabase
    .from<DBRelationMember>('relation_members')
    .insert(members);
  if (e) {
    const msg = `Error saving members for org (${org.name}) in database`;
    throw new APIError(`${msg}: ${e.message}`, 500);
  }
  return org;
}

export async function getOrg(id: string): Promise<Org> {
  const { data } = await supabase.from<DBOrg>('orgs').select().eq('id', id);
  if (!data || !data[0])
    throw new APIError(`Org (${id}) does not exist in database`);
  const { data: members } = await supabase
    .from<DBRelationMember>('relation_members')
    .select('user')
    .eq('org', id);
  const org = Org.fromDB(data[0]);
  org.members = (members || []).map((m) => m.user);
  return org;
}

export async function updateOrg(org: Org): Promise<Org> {
  const { error } = await supabase
    .from<DBOrg>('orgs')
    .upsert(org.toDB(), { onConflict: 'id' })
    .eq('id', org.id);
  if (error) {
    const msg = `Error updating org (${org.name}) in database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  const members = org.members.map((m) => ({ user: m, org: org.id }));
  const { error: e } = await supabase
    .from<DBRelationMember>('relation_members')
    .upsert(members);
  if (e) {
    const msg = `Error updating members for org (${org.name}) in database`;
    throw new APIError(`${msg}: ${e.message}`, 500);
  }
  return org;
}
