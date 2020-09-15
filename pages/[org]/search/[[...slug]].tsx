import { ParsedUrlQuery } from 'querystring';

import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Router, { useRouter } from 'next/router';
import useSWR, { mutate } from 'swr';
import equal from 'fast-deep-equal';

import { QueryHeader } from 'components/navigation';
import Page from 'components/page';
import AuthDialog from 'components/auth-dialog';
import RequestDialog from 'components/request-dialog';
import Search from 'components/search';

import { Option, Org, OrgJSON, User, UserJSON, UsersQuery } from 'lib/model';
import { db } from 'lib/api/helpers/firebase';
import { ListUsersRes } from 'lib/api/list-users';
import { useUser } from 'lib/account';
import { withI18n } from 'lib/intl';
import Utils from 'lib/utils';

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
  const { query: params } = useRouter();

  const [query, setQuery] = useState<UsersQuery>(
    UsersQuery.fromURLParams(params)
  );
  const [auth, setAuth] = useState<boolean>(false);
  const [canSearch, setCanSearch] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [viewing, setViewing] = useState<UserJSON | undefined>(user);

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

  useEffect(() => {
    if (!org || !org.id) return;
    const url = query.getURL(`/${org.id}/search/${viewing ? viewing.id : ''}`);
    void Router.push('/[org]/search/[[...slug]]', url, { shallow: true });
  }, [org, query, viewing]);
  useEffect(() => {
    setQuery((prev: UsersQuery) => {
      const updated = new UsersQuery({ ...prev });
      if (org && !org.aspects.includes(prev.aspect))
        [updated.aspect] = org.aspects;
      if (prev.visible !== true) updated.visible = true;
      if (!equal(prev, updated)) return updated;
      return prev;
    });
  }, [org, query]);
  useEffect(() => {
    setSearching(true);
    void mutate(query.endpoint);
  }, [query]);
  useEffect(() => {
    setSearching((prev: boolean) => prev && (isValidating || !data));
  }, [isValidating, data]);

  const results = useMemo(() => (data ? data.users : []), [data]);
  const onClosed = useCallback(() => setViewing(undefined), []);
  const subjects = useMemo(() => {
    if (!viewing) return [];
    return Utils.intersection<string, Option<string>>(
      viewing[query.aspect].subjects,
      query.subjects,
      (a: string, b: Option<string>) => a === b.value
    );
  }, [viewing, query.aspect, query.subjects]);

  return (
    <Page>
      <QueryHeader
        aspects={org ? org.aspects : ['mentoring', 'tutoring']}
        query={query}
        onChange={setQuery}
      />
      {auth && <AuthDialog org={org} />}
      {viewing && (
        <RequestDialog
          org={org}
          user={User.fromJSON(viewing)}
          aspect={query.aspect}
          onClosed={onClosed}
          subjects={subjects}
        />
      )}
      <Search
        query={query}
        results={results}
        searching={searching || !canSearch}
        onChange={setQuery}
        setViewing={setViewing}
      />
    </Page>
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
