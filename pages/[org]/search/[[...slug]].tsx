import { ParsedUrlQuery } from 'querystring';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import Router from 'next/router';
import equal from 'fast-deep-equal';

import { QueryHeader } from 'components/navigation';
import Search from 'components/search';
import Footer from 'components/footer';
import Intercom from 'components/react-intercom';
import RequestDialog from 'components/request-dialog';

import {
  Availability,
  Option,
  Org,
  OrgJSON,
  User,
  UserJSON,
  UsersQuery,
  UsersQueryJSON,
} from 'lib/model';
import { db } from 'lib/api/helpers/firebase';
import { withI18n } from 'lib/intl';
import Utils from 'lib/utils';

import match3rd from 'locales/en/match3rd.json';
import query3rd from 'locales/en/query3rd.json';
import search from 'locales/en/search.json';
import common from 'locales/en/common.json';

interface SearchPageProps {
  org: OrgJSON;
  query: UsersQueryJSON;
  results: UserJSON[];
  viewing: UserJSON | null;
}

interface SearchPageQuery extends ParsedUrlQuery {
  org: string;
  slug?: string[];
}

function onlyFirstAndLastInitial(name: string): string {
  const split: string[] = name.split(' ');
  return `${split[0]} ${split[split.length - 1][0]}.`;
}

/**
 * We search our Algolia index from the server-side before we even respond to
 * an HTTP request.
 * @todo Remove the `JSON.parse(JSON.stringify(ob))` workaround.
 */
export const getServerSideProps: GetServerSideProps<
  SearchPageProps,
  SearchPageQuery
> = async (ctx: GetServerSidePropsContext<SearchPageQuery>) => {
  async function getUser(params?: SearchPageQuery): Promise<UserJSON | null> {
    if (!params || !params.slug || !params.slug[0]) return null;
    const userDoc = await db.collection('users').doc(params.slug[0]).get();
    if (!userDoc.exists) return null;
    const user = User.fromFirestore(userDoc);
    return {
      name: onlyFirstAndLastInitial(user.name),
      photo: user.photo,
      bio: user.bio,
      availability: user.availability.toJSON(),
      mentoring: user.mentoring,
      tutoring: user.tutoring,
      socials: user.socials,
      langs: user.langs,
      id: user.id,
    } as UserJSON;
  }

  const query = UsersQuery.fromURLParams(ctx.query);
  const url = `http://${ctx.req.headers.host as string}/api/users`;

  const orgDoc = await db
    .collection('orgs')
    .doc(ctx.params?.org || '')
    .get();
  const org = Org.fromFirestore(orgDoc);

  query.visible = true;
  query.aspect = org.aspects[0] || 'tutoring';
  query.orgs = [{ label: org.name, value: org.id }];

  return {
    props: {
      org: org.toJSON(),
      query: query.toJSON(),
      results: (await query.search(url)).users.map((user) => user.toJSON()),
      viewing: await getUser(ctx.params),
    },
  };
};

function SearchPage({
  org,
  query: initialQuery,
  results: initialResults,
  viewing: initialViewing,
}: SearchPageProps): JSX.Element {
  const [searching, setSearching] = useState<boolean>(false);
  const [results, setResults] = useState<ReadonlyArray<User>>(
    initialResults.map((result: UserJSON) => User.fromJSON(result))
  );
  const [query, setQuery] = useState<UsersQuery>(
    UsersQuery.fromJSON(initialQuery)
  );
  const [viewing, setViewing] = useState<User | undefined>(
    initialViewing ? User.fromJSON(initialViewing) : undefined
  );

  const handleQueryChange = async (newQuery: UsersQuery) => {
    const updatedQuery: UsersQuery =
      newQuery.aspect === 'mentoring'
        ? new UsersQuery({ ...newQuery, availability: new Availability() })
        : newQuery;
    setQuery(updatedQuery);
    setSearching(true);
    setResults((await updatedQuery.search()).users);
    setSearching(false);
  };

  useEffect(() => {
    const url = query.getURL(`/${org.id}/search/${viewing ? viewing.id : ''}`);
    void Router.push('/[org]/search/[[...slug]]', url, { shallow: true });
  }, [org.id, query, viewing]);
  useEffect(() => {
    setQuery((prev: UsersQuery) => {
      const updated = new UsersQuery({ ...prev });
      if (!org.aspects.includes(prev.aspect)) [updated.aspect] = org.aspects;
      if (prev.visible !== true) updated.visible = true;
      if (!equal(prev, updated)) return updated;
      return prev;
    });
  }, [org.aspects, query]);

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
    <>
      <QueryHeader
        aspects={org.aspects}
        query={query}
        onChange={handleQueryChange}
      />
      {viewing && (
        <RequestDialog
          user={viewing}
          aspect={query.aspect}
          onClosed={onClosed}
          subjects={subjects}
        />
      )}
      <Search
        query={query}
        results={results}
        searching={searching}
        onChange={handleQueryChange}
        setViewing={setViewing}
      />
      <Footer />
      <Intercom />
    </>
  );
}

export default withI18n(SearchPage, { common, search, query3rd, match3rd });
