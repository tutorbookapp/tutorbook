import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { getOrg } from 'lib/api/db/org';
import { getUser } from 'lib/api/db/user';
import { handle } from 'lib/api/error';
import mail from 'lib/mail/request';
import segment from 'lib/api/segment';
import verifyAuth from 'lib/api/verify/auth';

export default async function requestAPI(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const { uid } = await verifyAuth(req.headers);
      const user = await getUser(uid);
      const body = req.body as { subjects: string[]; description: string; org: string };
      const org = await getOrg(body.org);
      const admins = await Promise.all(org.members.map((id) => getUser(id)));
      await mail(body.subjects, body.description, user, org, admins);
      segment.track({ event: 'Request Created', userId: uid });
    } catch (e) {
      handle(e, res);
    }
  }
}
