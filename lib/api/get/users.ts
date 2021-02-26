import { User, UsersQuery } from 'lib/model';
import {
  addArrayFilter,
  addOptionsFilter,
  addStringFilter,
  list,
} from 'lib/api/search';

/**
 * Creates and returns the filter string to search our Algolia index based on
 * `this.props.filters`. Note that due to Algolia restrictions, we can't nest
 * ANDs with ORs (e.g. `(A AND B) OR (B AND C)`). Because of this limitation, we
 * merge results from many queries on the client side (e.g. get results for
 * `A AND B` and merge them with the results for `B AND C`).
 * @see {@link http://bit.ly/3aHh6Pn}
 * @see {@link http://bit.ly/3avDhI6}
 * @see {@link http://bit.ly/38IXW9d}
 * @todo Why do we use `OR` to concat the `orgs` prop filter?
 */
function getFilterStrings(query: UsersQuery): string[] {
  let str = '';
  if (typeof query.visible === 'boolean')
    str = addStringFilter(str, `visible=${query.visible ? 1 : 0}`);
  str = addArrayFilter(str, query.orgs, 'orgs', 'OR');
  str = addArrayFilter(str, query.tags, '_tags');
  str = addOptionsFilter(str, query.subjects, `${query.aspect}.subjects`);
  str = addOptionsFilter(str, query.langs, 'langs');
  if (!query.availability.length) return [str];
  return query.availability.map((timeslot) =>
    addStringFilter(
      str,
      `(availability.from <= ${timeslot.from.valueOf()} AND` +
        ` availability.to >= ${timeslot.to.valueOf()})`
    )
  );
}

/**
 * Fetches users from our Algolia search indices based on a given query.
 * @param query - The query to use while searching.
 * @return Promise that resolves to an object containing:
 * 1. The total number of hits for that query (`hits`).
 * 2. The requested results (`users`) as an array of `User` objects.
 * We set `featured` as an optional filter in order to promote those results.
 * @see {@link http://bit.ly/2LVJcM9}
 */
export default async function getUsers(
  query: UsersQuery
): Promise<{ hits: number; results: User[] }> {
  const filters = getFilterStrings(query);
  const optionalFilters = `featured:${query.aspect}`;
  return list('users', query, User.fromSearchHit, filters, optionalFilters);
}
