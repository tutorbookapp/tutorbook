import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { dequal } from 'dequal/lite';
import useTranslation from 'next-translate/useTranslation';

import FilterHeader from 'components/filter-header';
import Page from 'components/page';
import Search from 'components/search';

import { PageProps, getPageProps } from 'lib/page';
import { CallbackParam } from 'lib/model/callback';
import { ListUsersRes } from 'lib/api/routes/users/list';
import { User } from 'lib/model/user';
import { UsersQuery } from 'lib/model/query/users';
import clone from 'lib/utils/clone';
import { prefetch } from 'lib/fetch';
import useAnalytics from 'lib/hooks/analytics';
import usePage from 'lib/hooks/page';
import useTrack from 'lib/hooks/track';
import useURLParamSync from 'lib/hooks/url-param-sync';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import match3rd from 'locales/en/match3rd.json';
import query3rd from 'locales/en/query3rd.json';
import search from 'locales/en/search.json';

// TODO: Reduce code duplication between this public "all orgs combined" search
// page and the org-specific search page at `/pages/[org]/search.tsx`.
function SearchPage(props: PageProps): JSX.Element {
  usePage({ name: 'Search' });

  const { t } = useTranslation();

  const [query, setQuery] = useState<UsersQuery>(new UsersQuery());
  const [hits, setHits] = useState<number>(query.hitsPerPage);
  const [searching, setSearching] = useState<boolean>(true);

  useURLParamSync(query, setQuery, UsersQuery, [
    'orgs',
    'available',
    'visible',
  ]);

  const { data, isValidating } = useSWR<ListUsersRes>(query.endpoint);

  // Save the number of hits from the last successful request.
  useEffect(() => setHits((prev) => data?.hits || prev), [data?.hits]);

  // Prefetch the next page of results (using SWR's global cache).
  // @see {@link https://swr.vercel.app/docs/prefetching}
  useEffect(() => {
    const nextPageQuery = new UsersQuery(
      clone({ ...query, page: query.page + 1 })
    );
    void prefetch(nextPageQuery.endpoint);
  }, [query]);

  // TODO: Perhaps we should only allow filtering by a single org, as we don't
  // ever filter by more than one at once.
  useEffect(() => {
    setQuery((prev: UsersQuery) => {
      const updated = new UsersQuery({
        ...prev,
        available: true,
        visible: true,
      });
      return dequal(prev, updated) ? prev : updated;
    });
  }, [query]);

  // TODO: Investigate why I'm still using this `useSWR` refresh workaround. I
  // should get rid of it when updating the `Query` object definitions.
  useEffect(() => {
    setSearching(true);
    void mutate(query.endpoint);
  }, [query]);

  // TODO: Debug issues where `searching` stays true even after we receive data
  // when the user continuously clicks the pagination buttons.
  useEffect(() => {
    setSearching((prev) => prev && (isValidating || !data));
  }, [isValidating, data]);

  const results = useMemo(() => (data ? data.users : []), [data]);

  const track = useTrack();
  const onQueryChange = useCallback(
    (param: CallbackParam<UsersQuery>) => {
      let updated = query;
      if (typeof param === 'object') updated = param;
      if (typeof param === 'function') updated = param(updated);
      setQuery(updated);
      track(
        'User List Filtered',
        {
          subjects: updated.subjects.join(' AND '),
          langs: updated.langs.join(' AND '),
        },
        2500
      );
    },
    [track, query]
  );

  // Uses the object-action framework event naming and known ecommerce events.
  // @see {@link https://segment.com/docs/connections/spec/ecommerce/v2/#product-list-filtered}
  // @see {@link https://segment.com/academy/collecting-data/naming-conventions-for-clean-data}
  const url = useMemo(() => {
    if (typeof window === 'undefined') return 'https://tutorbook.org';
    return `${window.location.protocol}//${window.location.host}`;
  }, []);
  useAnalytics(
    'User List Loaded',
    () =>
      !searching && {
        subjects: query.subjects.join(' AND '),
        langs: query.langs.join(' AND '),
        users: results.map((res, idx) => ({
          ...User.fromJSON(res).toSegment(),
          position: idx,
          url: `${url}/${res.orgs[0] || 'default'}/users/${res.id}`,
          subjects: res.subjects,
        })),
      }
  );

  return (
    <Page
      title='Search - Tutorbook'
      description={t('search:description', { name: 'Tutorbook', bio: '' })}
      {...props}
    >
      <FilterHeader query={query} onChange={setQuery} />
      <Search
        hits={hits}
        query={query}
        results={results}
        searching={searching}
        onChange={onQueryChange}
      />
    </Page>
  );
}

export const getStaticProps = getPageProps;

export default withI18n(SearchPage, { common, search, query3rd, match3rd });
