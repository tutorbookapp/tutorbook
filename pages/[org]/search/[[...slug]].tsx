import { ParsedUrlQuery } from 'querystring';

import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next';
import Router, { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import NProgress from 'nprogress';
import { dequal } from 'dequal/lite';

import AuthDialog from 'components/auth-dialog';
import Page from 'components/page';
import { QueryHeader } from 'components/navigation';
import RequestDialog from 'components/request-dialog';
import Search from 'components/search';

import {
  CallbackParam,
  Option,
  Org,
  OrgJSON,
  User,
  UserJSON,
  UsersQuery,
} from 'lib/model';
import { ListUsersRes } from 'lib/api/routes/users/list';
import { OrgContext } from 'lib/context/org';
import clone from 'lib/utils/clone';
import { db } from 'lib/api/firebase';
import { intersection } from 'lib/utils';
import { prefetch } from 'lib/fetch';
import { useUser } from 'lib/context/user';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import match3rd from 'locales/en/match3rd.json';
import query3rd from 'locales/en/query3rd.json';
import search from 'locales/en/search.json';

interface SearchPageProps {
  org?: OrgJSON;
  user?: UserJSON;
}

function SearchPage({ org, user }: SearchPageProps): JSX.Element {
  const { user: currentUser, loggedIn } = useUser();

  const [query, setQuery] = useState<UsersQuery>(new UsersQuery());
  const [hits, setHits] = useState<number>(query.hitsPerPage);
  const [auth, setAuth] = useState<boolean>(false);
  const [canSearch, setCanSearch] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [viewing, setViewing] = useState<UserJSON>();

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

  // Open the user dialog once our updated `getStaticProps` has resolved.
  // @see {@link https://nextjs.org/docs/basic-features/data-fetching}
  useEffect(() => setViewing(user), [user]);

  // Prefetch the next page of results (using SWR's global cache).
  // @see {@link https://swr.vercel.app/docs/prefetching}
  useEffect(() => {
    const nextPageQuery = new UsersQuery(
      clone({ ...query, page: query.page + 1 })
    );
    void prefetch(nextPageQuery.endpoint);
  }, [query]);

  const url = useRef<string>('');
  const { query: params } = useRouter();
  useEffect(() => {
    const updated = UsersQuery.fromURLParams(params);
    setQuery((prev) => (dequal(prev, updated) ? prev : updated));
  }, [params]);
  const onChange = useCallback(
    (param: CallbackParam<UsersQuery>) => {
      let updated = query;
      if (typeof param === 'object') updated = param;
      if (typeof param === 'function') updated = param(updated);
      if (!org || !org.id) return;
      if (!org.aspects.includes(updated.aspect)) [updated.aspect] = org.aspects;
      updated.visible = true;
      updated.orgs = [{ value: org.id, label: org.name }];
      const newURL = updated.getURL(`/${org.id}/search/${viewing?.id || ''}`);
      if (url.current === newURL) return;
      void Router.replace((url.current = newURL), undefined, { shallow: true });
    },
    [org, query, viewing?.id]
  );

  // Update query parameters whenever the `onChange` query checks change (e.g.
  // this ensures the `orgs` query prop is correctly filtering by org).
  useEffect(() => {
    void onChange((prev) => prev);
  }, [onChange]);

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
  const onClosed = useCallback(() => setViewing(undefined), []);
  const subjects = useMemo(() => {
    if (!viewing) return [];
    return intersection<string, Option<string>>(
      viewing[query.aspect].subjects,
      query.subjects,
      (a: string, b: Option<string>) => a === b.value
    );
  }, [viewing, query.aspect, query.subjects]);

  return (
    <OrgContext.Provider value={{ org: org ? Org.fromJSON(org) : undefined }}>
      <Page title={`${org?.name || 'Loading'} - Search - Tutorbook`}>
        <QueryHeader
          aspects={org ? org.aspects : ['mentoring', 'tutoring']}
          query={query}
          onChange={onChange}
        />
        {auth && <AuthDialog />}
        {viewing && (
          <RequestDialog
            user={User.fromJSON(viewing)}
            aspect={query.aspect}
            onClosed={onClosed}
            subjects={subjects}
          />
        )}
        <Search
          hits={hits}
          query={query}
          results={results}
          searching={searching || !canSearch}
          onChange={onChange}
          setViewing={setViewing}
        />
      </Page>
    </OrgContext.Provider>
  );
}

interface SearchPageQuery extends ParsedUrlQuery {
  org: string;
  slug?: string[];
}

export const getStaticProps: GetStaticProps<
  SearchPageProps,
  SearchPageQuery
> = async (ctx: GetStaticPropsContext<SearchPageQuery>) => {
  if (!ctx.params) throw new Error('Cannot fetch org w/out params.');
  const orgDoc = await db.collection('orgs').doc(ctx.params.org).get();
  if (!orgDoc.exists) throw new Error(`Org (${orgDoc.id}) doesn't exist.`);
  const props: SearchPageProps = { org: Org.fromFirestore(orgDoc).toJSON() };
  if (ctx.params.slug && ctx.params.slug[0]) {
    const userDoc = await db.collection('users').doc(ctx.params.slug[0]).get();
    if (!userDoc.exists) console.warn(`User (${userDoc.id}) doesn't exist.`);
    props.user = User.fromFirestore(userDoc).toJSON();
  }
  return { props, revalidate: 1 };
};

export const getStaticPaths: GetStaticPaths<SearchPageQuery> = async () => {
  const orgs = (await db.collection('orgs').get()).docs;
  const paths = orgs.map((org) => ({ params: { org: org.id, slug: [] } }));
  return { paths, fallback: true };
};

export default withI18n(SearchPage, { common, search, query3rd, match3rd });
