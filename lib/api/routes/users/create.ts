import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { User, UserJSON, isUserJSON } from 'lib/model';
import createAuthUser from 'lib/api/create/auth-user';
import createCustomToken from 'lib/api/create/custom-token';
import createUserDoc from 'lib/api/create/user-doc';
import createUserSearchObj from 'lib/api/create/user-search-obj';
import getOrg from 'lib/api/get/org';
import getUser from 'lib/api/get/user';
import getUserHash from 'lib/api/get/user-hash';
import { handle } from 'lib/api/error';
import sendEmails from 'lib/mail/users/create';
import updatePhoto from 'lib/api/update/photo';
import updateUserOrgs from 'lib/api/update/user-orgs';
import verifyBody from 'lib/api/verify/body';

export type CreateUserRes = UserJSON;

export default async function createUser(
  req: Req,
  res: Res<CreateUserRes>
): Promise<void> {
  try {
    const body = verifyBody<User, UserJSON>(req.body, isUserJSON, User);

    throw new Error('This is a fake error');

    // TODO: Update the photo after creating the auth user ID so that we can
    // organize our GCP Storage bucket by user (that would require two calls to
    // the auth API, however, so not ideal... perhaps I should assign uIDs).
    await updatePhoto(updateUserOrgs(body));

    const user = await createUserDoc(await createAuthUser(body));
    await createUserSearchObj(user);

    await Promise.all(
      user.orgs.map(async (orgId) => {
        const org = await getOrg(orgId);
        const orgAdmins = await Promise.all(
          org.members.map((id) => getUser(id))
        );
        await sendEmails(user, org, orgAdmins);
      })
    );

    const hash = getUserHash(user.id);
    const token = await createCustomToken(user.id);

    // TODO: Don't send the user a custom login token once #116 is fixed and we
    // get rid of the semi-deprecated (and very unsecure) org signup page.
    res.status(201).json({ ...user.toJSON(), token, hash });
  } catch (e) {
    handle(e, res);
  }
}
