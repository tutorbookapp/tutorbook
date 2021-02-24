import { NextApiRequest, NextApiResponse } from 'next';

import { UsersQuery, UsersQueryURL, isUsersQueryURL } from 'lib/model';
import csv from 'lib/api/csv';
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

    const query = verifyQuery<UsersQuery, UsersQueryURL>(
      req.query,
      isUsersQueryURL,
      UsersQuery
    );

    await verifyAuth(req.headers, { orgIds: query.orgs.map((o) => o.value) });

    // TODO: Update this using `paginationLimitedTo` or the `browseObjects` API
    // when we start scaling up (and have orgs with more than 1000 users each).
    query.hitsPerPage = 1000;

    const { results } = await getUsers(query);

    // TODO: Replace the language codes with their actual i18n names.
    csv(
      res,
      'users',
      results.map((user) => ({
        ID: user.id,
        Name: user.name,
        Email: user.email,
        Phone: user.phone,
        About: user.bio,
        Reference: user.reference,
        Languages: join(user.langs),
        'Mentoring Subjects': join(user.mentoring.subjects),
        'Tutoring Subjects': join(user.tutoring.subjects),
        'Mentoring Searches': join(user.mentoring.searches),
        'Tutoring Searches': join(user.tutoring.searches),
        'Profile Image URL': user.photo,
        'Banner Image URL': user.background,
        'Website URL': user.website,
        'LinkedIn URL': user.linkedin,
        'Twitter URL': user.twitter,
        'Facebook URL': user.facebook,
        'Instagram URL': user.instagram,
        'GitHub URL': user.github,
        'IndieHackers URL': user.indiehackers,
        Created: user.created.toString(),
        'Last Updated': user.updated.toString(),
      }))
    );
  } catch (e) {
    handle(e, res);
  }
}
