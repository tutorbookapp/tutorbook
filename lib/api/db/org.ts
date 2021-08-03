import { DBOrg, DBRelationMember, DBViewOrg, Org } from 'lib/model/org';
import { APIError } from 'lib/api/error';
import handle from 'lib/api/db/error';
import supabase from 'lib/api/supabase';

export async function createOrg(org: Org): Promise<Org> {
  const { data, error } = await supabase.from<DBOrg>('orgs').insert(org.toDB());
  handle('creating', 'org', org, error);
  const o = data ? Org.fromDB(data[0]) : org;
  const members = org.members.map((m) => ({ user: m, org: o.id }));
  const { error: err } = await supabase
    .from<DBRelationMember>('relation_members')
    .insert(members);
  handle('creating', 'members', members, err);
  return o;
}

export async function updateOrg(org: Org): Promise<Org> {
  const { data, error } = await supabase
    .from<DBOrg>('orgs')
    .update(org.toDB())
    .eq('id', org.id);
  handle('updating', 'org', org, error);
  const o = data ? Org.fromDB(data[0]) : org;
  const members = org.members.map((m) => ({ user: m, org: o.id }));
  const { error: err } = await supabase
    .from<DBRelationMember>('relation_members')
    .upsert(members, { onConflict: 'user,org' });
  handle('updating', 'members', members, err);
  return o;
}

export async function getOrg(id: string): Promise<Org> {
  const { data, error } = await supabase
    .from<DBViewOrg>('view_orgs')
    .select()
    .eq('id', id);
  handle('getting', 'org', id, error);
  if (!data?.length) throw new APIError(`Org (${id}) does not exist`, 404);
  return Org.fromDB(data[0]);
}

export async function getOrgs(): Promise<Org[]> {
  const { data, error } = await supabase.from<DBViewOrg>('view_orgs').select();
  handle('getting', 'orgs', {}, error);
  return (data || []).map((d) => Org.fromDB(d));
}

export async function getOrgsByAdminId(adminId: string): Promise<Org[]> {
  const { data, error } = await supabase
    .from<DBViewOrg>('view_orgs')
    .select()
    .contains('members', [adminId]);
  handle('getting', 'orgs by admin', adminId, error);
  return (data || []).map((d) => Org.fromDB(d));
}
