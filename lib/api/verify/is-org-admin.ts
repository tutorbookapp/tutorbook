import { APIError } from 'lib/model/error';
import { Org } from 'lib/model/org';

export default function verifyIsOrgAdmin(org: Org, uid: string): void {
  if (!org.members.includes(uid)) {
    const msg = `You are not a ${org.name} admin. To fix, make sure to select yourself as a "Parent" above and try again.`;
    throw new APIError(msg, 400);
  }
}
