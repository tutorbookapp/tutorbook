import { APIError } from 'lib/model/error';
import { Org } from 'lib/model/org';

export default function verifyIsOrgAdmin(org: Org, uid: string): void {
  if (!org.members.includes(uid)) {
    const msg = `User (${uid}) is not a ${org.toString()} admin`;
    throw new APIError(msg, 400);
  }
}
