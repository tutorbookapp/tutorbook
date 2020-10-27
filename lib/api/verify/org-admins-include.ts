import { APIError } from 'lib/api/error';
import { Org } from 'lib/model';

export default function verifyOrgAdminsInclude(org: Org, uid: string): void {
  if (!org.members.includes(uid)) {
    const msg = `${org.toString()} admins must include user (${uid})`;
    throw new APIError(msg, 400);
  }
}
