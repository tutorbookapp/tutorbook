import * as admin from 'firebase-admin';
import { v4 as uuid } from 'uuid';

import React from 'react';
import Router from 'next/router';
import Intercom from '@tutorbook/react-intercom';
import Footer from '@tutorbook/footer';
import Search from '@tutorbook/search';

import { GetServerSideProps } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { QueryHeader } from '@tutorbook/header';
import { useIntl, getIntlProps, withIntl } from '@tutorbook/intl';
import {
  User,
  UserJSON,
  Query,
  QueryJSON,
  Availability,
} from '@tutorbook/model';

type App = admin.app.App;
type DocumentReference = admin.firestore.DocumentReference;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;

interface SearchPageProps {
  query: QueryJSON;
  results: ReadonlyArray<UserJSON>;
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
    const db: DocumentReference =
      process.env.NODE_ENV === 'development'
        ? firebase.firestore().collection('partitions').doc('test')
        : firebase.firestore().collection('partitions').doc('default');

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
    };
  }

  const query: Query = Query.fromURLParams(context.query);
  const url = `http://${context.req.headers.host as string}/api/users`;

  return {
    props: {
      query: JSON.parse(JSON.stringify(query)) as QueryJSON,
      results: JSON.parse(
        JSON.stringify(await query.search(url))
      ) as UserJSON[],
      user: JSON.parse(
        JSON.stringify(await getUser(context.params))
      ) as UserJSON | null,
      ...(await getIntlProps(context)),
    },
  };
};

function SearchPage({ query, results, user }: SearchPageProps): JSX.Element {
  const [searching, setSearching] = React.useState<boolean>(false);
  const [res, setResults] = React.useState<ReadonlyArray<User>>(
    results.map((result: UserJSON) => User.fromJSON(result))
  );
  const [qry, setQuery] = React.useState<Query>(Query.fromJSON(query));
  const { locale } = useIntl();
  const handleChange = async (newQuery: Query) => {
    // TODO: Store the availability filters in the tutoring aspect and then
    // re-fill them when we go back to that aspect. Or, just keep them in the
    // query and ignore them when searching for mentors (i.e. in `api/users`).
    const updatedQuery: Query =
      newQuery.aspect === 'mentoring'
        ? new Query({ ...newQuery, availability: new Availability() })
        : newQuery;
    setQuery(updatedQuery);
    setSearching(true);
    setResults(await updatedQuery.search());
    setSearching(false);
  };

  React.useEffect(() => {
    void Router.push('/[locale]/search/[[...slug]]', `/${locale}${qry.url}`, {
      shallow: true,
    });
  }, [qry, locale]);

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

export default withIntl<SearchPageProps>(SearchPage);
