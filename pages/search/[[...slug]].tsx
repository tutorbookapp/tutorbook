import * as admin from 'firebase-admin';
import { v4 as uuid } from 'uuid';

import React from 'react';
import Intercom from 'components/react-intercom';
import Footer from 'components/footer';
import Search from 'components/search';

import Router, { useRouter } from 'next/router';

import { withI18n } from 'lib/intl';
import { GetServerSideProps } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { QueryHeader } from 'components/header';
import {
  User,
  UserJSON,
  UsersQuery,
  UsersQueryJSON,
  Availability,
} from 'lib/model';

import common from 'locales/en/common.json';
import search from 'locales/en/search.json';
import query from 'locales/en/query.json';

type App = admin.app.App;
type Firestore = admin.firestore.Firestore;
type DocumentReference = admin.firestore.DocumentReference;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;

interface SearchPageProps {
  query: UsersQueryJSON;
  results: UserJSON[];
  user?: UserJSON;
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
export const getServerSideProps: GetServerSideProps = async (context) => {
  async function getUser(params?: ParsedUrlQuery): Promise<UserJSON | null> {
    if (!params || !params.slug || !params.slug.length) return null;

    /**
     * Initializes a new `firebase.admin` instance with limited database/Firestore
     * capabilities (using the `databaseAuthVariableOverride` option).
     * @see {@link https://firebase.google.com/docs/reference/admin/node/admin.AppOptions#optional-databaseauthvariableoverride}
     * @see {@link https://firebase.google.com/docs/database/admin/start#authenticate-with-limited-privileges}
     *
     * Also note that we use [UUID]{@link https://github.com/uuidjs/uuid} package to
     * generate a unique `firebaseAppId` every time this API is called.
     * @todo Lift this Firebase app definition to a top-level file that is imported
     * by all the `/api/` endpoints.
     *
     * We have a workaround for the `FIREBASE_ADMIN_KEY` error we were encountering
     * on Vercel a while ago.
     * @see {@link https://github.com/tutorbookapp/covid-tutoring/issues/29}
     * @see {@link https://stackoverflow.com/a/41044630/10023158}
     * @see {@link https://stackoverflow.com/a/50376092/10023158}
     */
    const firebase: App = admin.initializeApp(
      {
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: (process.env.FIREBASE_ADMIN_KEY as string).replace(
            /\\n/g,
            '\n'
          ),
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
        serviceAccountId: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        databaseAuthVariableOverride: { uid: 'server' },
      },
      uuid()
    );
    const firestore: Firestore = firebase.firestore();
    const db: DocumentReference =
      process.env.NODE_ENV === 'development'
        ? firestore.collection('partitions').doc('test')
        : firestore.collection('partitions').doc('default');

    firestore.settings({ ignoreUndefinedProperties: true });

    const userDoc: DocumentSnapshot = await db
      .collection('users')
      .doc(params.slug[0])
      .get();
    if (!userDoc.exists) return null;
    const user: User = User.fromFirestore(userDoc);
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

  const query: UsersQuery = UsersQuery.fromURLParams(context.query);
  const url = `http://${context.req.headers.host as string}/api/users`;

  query.visible = true;
  if (context.params && context.params.org)
    query.orgs = [{ label: '', value: context.params.org as string }];

  return {
    props: {
      query: JSON.parse(JSON.stringify(query)) as UsersQueryJSON,
      results: JSON.parse(
        JSON.stringify((await query.search(url)).users)
      ) as UserJSON[],
      user: JSON.parse(
        JSON.stringify(await getUser(context.params))
      ) as UserJSON | null,
    },
  };
};

function SearchPage({ query, results, user }: SearchPageProps): JSX.Element {
  const [searching, setSearching] = React.useState<boolean>(false);
  const [res, setResults] = React.useState<ReadonlyArray<User>>(
    results.map((result: UserJSON) => User.fromJSON(result))
  );
  const [qry, setQuery] = React.useState<UsersQuery>(
    UsersQuery.fromJSON(query)
  );

  const {
    query: { org },
  } = useRouter();

  const handleChange = async (newQuery: UsersQuery) => {
    // TODO: Store the availability filters in the tutoring aspect and then
    // re-fill them when we go back to that aspect. Or, just keep them in the
    // query and ignore them when searching for mentors (i.e. in `api/users`).
    const updatedQuery: UsersQuery =
      newQuery.aspect === 'mentoring'
        ? new UsersQuery({ ...newQuery, availability: new Availability() })
        : newQuery;
    setQuery(updatedQuery);
    setSearching(true);
    setResults((await updatedQuery.search()).users);
    setSearching(false);
  };

  React.useEffect(() => {
    if (typeof org === 'string')
      setQuery(
        (prev: UsersQuery) =>
          new UsersQuery({ ...prev, orgs: [{ label: '', value: org }] })
      );
  }, [org]);
  React.useEffect(() => {
    if (typeof org === 'string') {
      void Router.push('/[org]/search/[[...slug]]', `/${org}${qry.url}`, {
        shallow: true,
      });
    } else {
      void Router.push('/search/[[...slug]]', `${qry.url}`, { shallow: true });
    }
  }, [org, qry]);
  React.useEffect(() => {
    if (qry.visible !== true)
      setQuery(new UsersQuery({ ...qry, visible: true }));
  }, [qry]);

  return (
    <>
      <QueryHeader query={qry} onChange={handleChange} />
      <Search
        query={qry}
        results={res}
        searching={searching}
        user={user ? User.fromJSON(user) : undefined}
        onChange={handleChange}
      />
      <Footer />
      <Intercom />
    </>
  );
}

export default withI18n(SearchPage, { common, search, query });
