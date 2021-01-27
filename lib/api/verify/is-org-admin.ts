import { APIError } from 'lib/api/error';
import { Org } from 'lib/model';

export default function verifyIsOrgAdmin(org: Org, uid: string): void {
  if (!org.members.includes(uid)) {
    const msg = `User (${uid}) is not a(n) ${org.toString()} admin`;
    throw new APIError(msg, 400);
  }
}
