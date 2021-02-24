import { NextApiRequest, NextApiResponse } from 'next';
import stringify from 'csv-stringify';

import { UsersQuery, UsersQueryURL, isUsersQueryURL } from 'lib/model';
import getUsers from 'lib/api/get/users';
import { handle } from 'lib/api/error';
import { join } from 'lib/utils';
import verifyAuth from 'lib/api/verify/auth';
import verifyQuery from 'lib/api/verify/query';

/**
 * GET - Downloads a CSV list of the filtered users.
 *
 * Requires admin authentication.
 */
export default async function users(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
      return;
    }

    const stringifier = stringify();
    const query = verifyQuery<UsersQuery, UsersQueryURL>(
      req.query,
      isUsersQueryURL,
      UsersQuery
    );

    // TODO: Update this using `paginationLimitedTo` or the `browseObjects` API
    // when we start scaling up (and have orgs with more than 1000 users each).
    query.hitsPerPage = 1000;

    stringifier.write([
      'ID',
      'Name',
      'Email',
      'Phone',
      'About',
      'Reference',
      'Languages',
      'Mentoring Subjects',
      'Tutoring Subjects',
      'Mentoring Searches',
      'Tutoring Searches',
      'Profile Image URL',
      'Banner Image URL',
      'Website URL',
      'LinkedIn URL',
      'Twitter URL',
      'Facebook URL',
      'Instagram URL',
      'GitHub URL',
      'IndieHackers URL',
      'Created',
      'Last Updated',
    ]);

    await verifyAuth(req.headers, { orgIds: query.orgs.map((o) => o.value) });

    // TODO: Replace the language codes with their actual i18n names.
    (await getUsers(query)).results.forEach((user) =>
      stringifier.write([
        user.id,
        user.name,
        user.email,
        user.phone,
        user.bio,
        user.reference,
        join(user.langs),
        join(user.mentoring.subjects),
        join(user.tutoring.subjects),
        join(user.mentoring.searches),
        join(user.tutoring.searches),
        user.photo,
        user.background,
        user.website,
        user.linkedin,
        user.twitter,
        user.facebook,
        user.instagram,
        user.github,
        user.indiehackers,
        user.created.toString(),
        user.updated.toString(),
      ])
    );

    res.writeHead(200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment;filename=users.csv',
    });
    stringifier.pipe(res);
    stringifier.end();
  } catch (e) {
    handle(e, res);
  }
}
