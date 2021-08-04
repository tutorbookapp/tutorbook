import { DBOrg, DBRelationMember, DBViewOrg, Org } from 'lib/model/org';
import { APIError } from 'lib/model/error';
import handle from 'lib/api/db/error';
import logger from 'lib/api/logger';
import supabase from 'lib/api/supabase';

export async function createOrg(org: Org): Promise<Org> {
  logger.verbose(`Inserting org (${org.toString()}) row...`);
  const { data, error } = await supabase.from<DBOrg>('orgs').insert(org.toDB());
  handle('creating', 'org', org, error);
  const o = data ? Org.fromDB(data[0]) : org;
  const members = org.members.map((m) => ({ user: m, org: o.id }));
  logger.verbose(`Inserting org members (${JSON.stringify(members)}) rows...`);
  const { error: err } = await supabase
    .from<DBRelationMember>('relation_members')
    .insert(members);
  handle('creating', 'members', members, err);
  return new Org({ ...o, members: org.members });
}

export async function updateOrg(org: Org): Promise<Org> {
  logger.verbose(`Updating org (${org.toString()}) row...`);
  const { data, error } = await supabase
    .from<DBOrg>('orgs')
    .update(org.toDB())
    .eq('id', org.id);
  handle('updating', 'org', org, error);
  const o = data ? Org.fromDB(data[0]) : org;
  const members = org.members.map((m) => ({ user: m, org: o.id }));
  logger.verbose(`Upserting org members (${JSON.stringify(members)}) rows...`);
  const { error: err } = await supabase
    .from<DBRelationMember>('relation_members')
    .upsert(members, { onConflict: 'user,org' });
  handle('updating', 'members', members, err);
  return new Org({ ...o, members: org.members });
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
  // TODO: Remove this weird edge case workaround for no results.
  // @see {@link https://github.com/supabase/postgrest-js/issues/202}
  if (error instanceof Array) return [];
  handle('getting', 'orgs', {}, error);
  return (data || []).map((d) => Org.fromDB(d));
}

export async function getOrgsByAdminId(adminId: string): Promise<Org[]> {
  const { data, error } = await supabase
    .from<DBViewOrg>('view_orgs')
    .select()
    .contains('members', [adminId]);
  // TODO: Remove this weird edge case workaround for no results.
  // @see {@link https://github.com/supabase/postgrest-js/issues/202}
  if (error instanceof Array) return [];
  handle('getting', 'orgs by admin', adminId, error);
  return (data || []).map((d) => Org.fromDB(d));
}
