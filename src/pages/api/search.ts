import { NextApiRequest, NextApiResponse } from 'next';
import { SearchClient, SearchIndex } from 'algoliasearch/lite';
import { SearchOptions, SearchResponse } from '@algolia/client-search';
import {
  User,
  UserSearchHitAlias,
  FiltersInterface,
  Availability,
} from '@tutorbook/model';

import to from 'await-to-js';
import algoliasearch from 'algoliasearch/lite';

const algoliaId: string = process.env.ALGOLIA_SEARCH_ID as string;
const algoliaKey: string = process.env.ALGOLIA_SEARCH_KEY as string;

const client: SearchClient = algoliasearch(algoliaId, algoliaKey);
const index: SearchIndex = client.initIndex(
  process.env.NODE_ENV === 'development' ? 'test-users' : 'default-users'
);

/**
 * Searches users based on the current filters by querying like:
 * > Show me all users whose availability contains a timeslot whose open time
 * > is equal to or before the desired open time and whose close time is equal
 * > to or after the desired close time.
 * Note that due to Algolia limitations, we must query for each availability
 * timeslot separately and then manually merge the results on the client side.
 */
async function searchUsers(
  filters: FiltersInterface
): Promise<ReadonlyArray<User>> {
  const results: User[] = [];
  let filterStrings: (string | undefined)[] = getFilterStrings(filters);
  if (!filterStrings.length) filterStrings = [undefined];
  for (const filterString of filterStrings) {
    const options: SearchOptions | undefined = filterString
      ? { filters: filterString }
      : undefined;
    const [err, res] = await to<SearchResponse<UserSearchHitAlias>>(
      index.search('', options) as Promise<SearchResponse<UserSearchHitAlias>>
    );
    if (err || !res) {
      console.error(`[ERROR] While searching ${filterString}:`, err);
    } else {
      res.hits.forEach((hit: UserSearchHitAlias) => {
        if (results.findIndex((h) => h.uid === hit.objectID) < 0)
          results.push(User.fromSearchHit(hit));
      });
    }
  }
  return results;
}

/**
 * Creates and returns the filter string to search our Algolia index based on
 * `this.props.filters`. Note that due to Algolia restrictions, we **cannot**
 * nest ANDs with ORs (e.g. `(A AND B) OR (B AND C)`). Because of this
 * limitation, we merge results from many queries on the client side (e.g. get
 * results for `A AND B` and merge them with the results for `B AND C`).
 * @example
 * '(subjects.explicit:"Chemistry H" OR subjects.explicit:"Chemistry") AND ' +
 * '((availability.from <= 1587304800001 AND availability.to >= 1587322800000))'
 * @see {@link https://www.algolia.com/doc/guides/managing-results/refine-results/filtering/how-to/filter-by-date/?language=javascript}
 * @see {@link https://www.algolia.com/doc/guides/managing-results/refine-results/filtering/in-depth/combining-boolean-operators/#combining-ands-and-ors}
 * @see {@link https://www.algolia.com/doc/guides/managing-results/refine-results/filtering/how-to/filter-arrays/?language=javascript}
 */
function getFilterStrings(filters: FiltersInterface): string[] {
  let filterString: string = '';
  for (let i = 0; i < filters.subjects.length; i++) {
    filterString += i === 0 ? '(' : ' OR ';
    filterString += `subjects.explicit:"${filters.subjects[i]}"`;
    if (i === filters.subjects.length - 1) filterString += ')';
  }
  if (filters.availability.length && filters.subjects.length)
    filterString += ' AND ';
  const filterStrings: string[] = [];
  for (const timeslot of filters.availability)
    filterStrings.push(
      filterString +
        `(availability.from <= ${timeslot.from.valueOf()}` +
        ` AND availability.to >= ${timeslot.to.valueOf()})`
    );
  if (!filters.availability.length) filterStrings.push(filterString);
  return filterStrings;
}

/**
 * For privacy reasons, we only add the user's first name and last initial to
 * our Algolia search index (and thus we **never** share the user's full name).
 * @example
 * assert(onlyFirstNameAndLastInitial('Nicholas Chiang') === 'Nicholas C.');
 * @todo Avoid code duplication from `algoliaUserUpdate` Firebase Function.
 */
function onlyFirstNameAndLastInitial(name: string): string {
  const split: string[] = name.split(' ');
  return `${split[0]} ${split[split.length - 1][0]}.`;
}

/**
 * Takes filter parameters (subjects and availability) and sends back an array
 * of `UserJSONInterface`s that match the given filters.
 *
 * Note that we only send non-sensitive user information back to the client:
 * - User's first name and last initial
 * - User's bio (e.g. their education and experience)
 * - User's availability (for tutoring)
 * - User's subjects (what they can tutor)
 * - User's searches (what they need tutoring for)
 * - User's Firebase Authentication uID (as the Algolia `objectID`)
 *
 * @todo Perhaps we should also include a `photoURL` here (to make our search
 * results look more appealing).
 * @todo Should the client have to be authenticated to make this request (i.e.
 * should we require a Firebase Authentication JWT to see search results)?
 */
export default async function search(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  console.log('[DEBUG] Getting search results...');
  const subjects: string = req.query.subjects as string;
  const availability: string = req.query.availability as string;
  const filters: FiltersInterface = {
    subjects: subjects ? JSON.parse(decodeURIComponent(subjects)) : [],
    availability: availability
      ? Availability.fromURLParam(availability)
      : new Availability(),
  };
  const results: ReadonlyArray<User> = await searchUsers(filters);
  console.log(`[DEBUG] Got ${results.length} results.`);
  res.status(200).send(
    results.map((user: User) => ({
      name: onlyFirstNameAndLastInitial(user.name),
      bio: user.bio,
      availability: user.availability.toJSON(),
      subjects: user.subjects,
      searches: user.searches,
      socials: user.socials,
      uid: user.uid,
    }))
  );
}
