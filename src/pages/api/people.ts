import { NextApiRequest, NextApiResponse } from 'next';
import { SearchHit, Org, User, UserJSON, ApiError } from '@tutorbook/model';
import { db, auth, DecodedIdToken } from '@tutorbook/admin';

import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch/lite';
import to from 'await-to-js';

const algoliaId: string = process.env.ALGOLIA_SEARCH_ID as string;
const algoliaKey: string = process.env.ALGOLIA_SEARCH_KEY as string;

const client: SearchClient = algoliasearch(algoliaId, algoliaKey);
const index: SearchIndex = client.initIndex(
  process.env.NODE_ENV === 'development'
    ? 'test-admin-users'
    : 'default-admin-users'
);

export default async function people(
  req: NextApiRequest,
  res: NextApiResponse<ApiError | UserJSON[]>
): Promise<void> {
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  function error(msg: string, code = 400, err?: Error): void {
    console.error(`[ERROR] Sending client ${code} with msg (${msg})...`, err);
    res.status(code).send({ msg, ...(err || {}) });
  }
  if (!req.query) {
    error('You must provide a request query.');
  } else if (!req.query.id || typeof req.query.id !== 'string') {
    error('You must provide a valid organization ID.');
  } else if (!req.query.token || typeof req.query.token !== 'string') {
    error('You must provide a valid Firebase Auth JWT.');
  } else {
    const [err, token] = await to<DecodedIdToken>(
      auth.verifyIdToken(req.query.token, true)
    );
    if (err) {
      error(`Your Firebase Auth JWT is invalid: ${err.message}`, 401, err);
    } else {
      const org = await db.collection('orgs').doc(req.query.id).get();
      if (!org.exists) {
        error(`Organization (${org.id}) did not exist.`, 400);
      } else if (
        Org.fromFirestore(org).members.indexOf((token as DecodedIdToken).uid) <
        0
      ) {
        error(
          `You (${(token as DecodedIdToken).uid} are not a member of org (${
            org.id
          }).`,
          401
        );
      } else {
        const users: UserJSON[] = (
          await index.search<SearchHit>('', {
            filters: `orgs:${org.id} AND is_not_vetted`,
          })
        ).hits.map((hit: SearchHit) => User.fromSearchHit(hit).toJSON());
        res.status(200).send(users);
      }
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access */
}
