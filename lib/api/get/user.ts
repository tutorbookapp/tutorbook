import { APIError } from 'lib/api/error';
import { User } from 'lib/model/user';
import supabase from 'lib/api/supabase';

type DBAspect = 'mentoring' | 'tutoring';
interface DBSocial {
  type:
    | 'website'
    | 'linkedin'
    | 'twitter'
    | 'facebook'
    | 'instagram'
    | 'github'
    | 'indiehackers';
  url: string;
}
interface DBTimeslot {
  id: string;
  from: Date;
  to: Date;
  exdates: Date[];
  recur: string;
  last: Date;
}
interface DBUser {
  id: string;
  uid: string | null;
  name: string;
  photo: string | null;
  email: string | null;
  phone: string | null;
  bio: string;
  background: string | null;
  venue: string | null;
  socials: DBSocial[];
  availability: DBTimeslot[];
  mentoring: string[];
  tutoring: string[];
  langs: string[];
  visible: boolean;
  featured: DBAspect[];
  reference: string;
  timezone: string | null;
  age: number | null;
  tags: (
    | 'vetted'
    | 'matched'
    | 'meeting'
    | 'tutor'
    | 'tutee'
    | 'mentor'
    | 'mentee'
    | 'parent'
  )[];
  created: Date;
  updated: Date;
}
interface DBRelationParent {
  user: string;
  parent: string;
}
interface DBRelationOrg {
  user: string;
  org: string;
}

export default async function getUser(uid: string): Promise<User> {
  const { data } = await supabase.from('users').select().eq('id', uid);
  if (!data || !data[0])
    throw new APIError(`User (${uid}) does not exist`, 400);
  return User.parse(data[0]);
}
