import { ParsedUrlQuery } from 'querystring';

import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import NProgress from 'nprogress';
import Router from 'next/router';
import { dequal } from 'dequal/lite';

import AuthDialog from 'components/auth-dialog';
import Page from 'components/page';
import { QueryHeader } from 'components/navigation';
import Search from 'components/search';

import { CallbackParam, Org, OrgJSON, User, UsersQuery } from 'lib/model';
import { useAnalytics, usePage, useTrack } from 'lib/hooks';
import { ListUsersRes } from 'lib/api/routes/users/list';
import { OrgContext } from 'lib/context/org';
import clone from 'lib/utils/clone';
import { db } from 'lib/api/firebase';
import { prefetch } from 'lib/fetch';
import { useUser } from 'lib/context/user';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import match3rd from 'locales/en/match3rd.json';
import query3rd from 'locales/en/query3rd.json';
import search from 'locales/en/search.json';

interface SearchPageProps {
  org?: OrgJSON;
}

function SearchPage({ org }: SearchPageProps): JSX.Element {
  usePage({ name: 'Org Search', org: org?.id });

  const { user: currentUser, loggedIn } = useUser();

  const [query, setQuery] = useState<UsersQuery>(new UsersQuery());
  const [hits, setHits] = useState<number>(query.hitsPerPage);
  const [auth, setAuth] = useState<boolean>(false);
  const [canSearch, setCanSearch] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(true);

  const { data, isValidating } = useSWR<ListUsersRes>(
    canSearch ? query.endpoint : null
  );

  /**
   * If the user isn't a part of this org, attempt to add them using the
   * `/api/users` endpoint. If that endpoint errors, show an undismissable
   * dialog explaining the error (includes an org-configurable prompt too).
   * @todo Add this validation to the back-end as well.
   * @see {@link https://github.com/tutorbookapp/tutorbook/issues/115}
   */
  useEffect(() => {
    if (!org || loggedIn === undefined) {
      setAuth(false);
      setCanSearch(false);
    } else if (
      currentUser.orgs.includes(org.id) ||
      !org.domains.length ||
      org.domains.some((d: string) => currentUser.email.endsWith(`@${d}`))
    ) {
      setAuth(false);
      setCanSearch(true);
    } else {
      setAuth(true);
      setCanSearch(false);
    }
  }, [loggedIn, currentUser, org]);

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

  useEffect(() => {
    // TODO: Ideally, we'd be able to use Next.js's `useRouter` hook to get the
    // URL query parameters, but right now, it doesn't seem to be working. Once
    // we do replace this with the `useRouter` hook, we'll be able to replace
    // state management with just shallowly updating the URL.
    // @see {@link https://github.com/vercel/next.js/issues/17112}
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setQuery(UsersQuery.fromURLParams(Object.fromEntries(params.entries())));
  }, []);

  // TODO: Use the built-in Next.js router hook to manage this query state and
  // show the `NProgress` loader when the results are coming in.
  useEffect(() => {
    if (!org || !org.id) return;
    const url = query.getURL(`/${org.id}/search`);
    void Router.replace(url, undefined, { shallow: true });
  }, [org, query]);

  // TODO: Perhaps we should only allow filtering by a single org, as we don't
  // ever filter by more than one at once.
  useEffect(() => {
    setQuery((prev: UsersQuery) => {
      const updated = new UsersQuery({ ...prev, visible: true });
      if (!org) return dequal(prev, updated) ? prev : updated;
      if (!org.aspects.includes(prev.aspect)) [updated.aspect] = org.aspects;
      updated.orgs = [{ value: org.id, label: org.name }];
      return dequal(prev, updated) ? prev : updated;
    });
  }, [org, query]);

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

  // TODO: Debug how Next.js calls NProgress for shallow page transitions.
  useEffect(() => {
    if (searching) NProgress.start();
    if (!searching) NProgress.done();
  }, [searching]);

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
          org: org ? Org.fromJSON(org).toSegment() : undefined,
          subjects: updated.subjects.map((o) => o.value).join(' AND '),
          langs: updated.langs.map((o) => o.value).join(' AND '),
          aspect: updated.aspect,
        },
        2500
      );
    },
    [track, query, org]
  );

  // Uses the object-action framework event naming and known ecommerce events.
  // @see {@link https://segment.com/docs/connections/spec/ecommerce/v2/#product-list-filtered}
  // @see {@link https://segment.com/academy/collecting-data/naming-conventions-for-clean-data}
  const url = useMemo(() => {
    if (typeof window === 'undefined') return 'https://tutorbook.app';
    return `${window.location.protocol}//${window.location.host}`;
  }, []);
  useAnalytics(
    'User List Loaded',
    () =>
      !searching && {
        org: org ? Org.fromJSON(org).toSegment() : undefined,
        subjects: query.subjects.map((o) => o.value).join(' AND '),
        langs: query.langs.map((o) => o.value).join(' AND '),
        aspect: query.aspect,
        users: results.map((res, idx) => ({
          ...User.fromJSON(res).toSegment(),
          position: idx,
          url: `${url}/${org?.id || 'default'}/search/${res.id}`,
          subjects: res[query.aspect].subjects,
        })),
      }
  );

  return (
    <OrgContext.Provider value={{ org: org ? Org.fromJSON(org) : undefined }}>
      <Page title={`${org?.name || 'Loading'} - Search - Tutorbook`}>
        <QueryHeader
          aspects={org ? org.aspects : ['mentoring', 'tutoring']}
          query={query}
          onChange={onQueryChange}
        />
        {auth && <AuthDialog />}
        <Search
          hits={hits}
          query={query}
          results={results}
          searching={searching || !canSearch}
          onChange={onQueryChange}
        />
      </Page>
    </OrgContext.Provider>
  );
}

interface SearchPageQuery extends ParsedUrlQuery {
  org: string;
}

// TODO: Incrementally statically generate each empty aspect query.
export const getStaticProps: GetStaticProps<
  SearchPageProps,
  SearchPageQuery
> = async (ctx: GetStaticPropsContext<SearchPageQuery>) => {
  if (!ctx.params) throw new Error('Cannot fetch org w/out params.');
  const doc = await db.collection('orgs').doc(ctx.params.org).get();
  if (!doc.exists) return { notFound: true };
  return { props: { org: Org.fromFirestoreDoc(doc).toJSON() }, revalidate: 1 };
};

export const getStaticPaths: GetStaticPaths<SearchPageQuery> = async () => {
  const orgs = (await db.collection('orgs').get()).docs;
  const paths = orgs.map((org) => ({ params: { org: org.id } }));
  return { paths, fallback: true };
};

export default withI18n(SearchPage, { common, search, query3rd, match3rd });
