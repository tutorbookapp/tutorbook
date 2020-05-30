import React from 'react';
import { GetServerSideProps } from 'next';
import { AxiosResponse, AxiosError } from 'axios';

import to from 'await-to-js';
import axios from 'axios';

import Intercom from '@tutorbook/react-intercom';
import Header from '@tutorbook/header';
import Footer from '@tutorbook/footer';
import Search from '@tutorbook/search';

import { getIntlProps, withIntl } from '@tutorbook/intl';
import {
  User,
  UserJSONInterface,
  Query,
  Aspect,
  QueryJSONInterface,
  Availability,
} from '@tutorbook/model';

interface SearchPageProps {
  query: QueryJSONInterface;
  results: ReadonlyArray<UserJSONInterface>;
}

async function getSearchResults(
  query: Query,
  url: string = '/api/search'
): Promise<ReadonlyArray<User>> {
  const [err, res] = await to<AxiosResponse<UserJSONInterface[]>, AxiosError>(
    axios({
      url,
      method: 'get',
      params: {
        aspect: encodeURIComponent(query.aspect),
        subjects: encodeURIComponent(JSON.stringify(query.subjects)),
        availability: query.availability.toURLParam(),
      },
    })
  );
  if (err && err.response) {
    console.error(`[ERROR] ${err.response.data}`);
    throw new Error(err.response.data);
  } else if (err && err.request) {
    console.error('[ERROR] Search REST API did not respond:', err.request);
    throw new Error('Search REST API did not respond.');
  } else if (err) {
    console.error('[ERROR] While sending request:', err);
    throw new Error(`While sending request: ${err.message}`);
  } else {
    return (res as AxiosResponse<UserJSONInterface[]>).data.map(
      (user: UserJSONInterface) => {
        return User.fromJSON(user);
      }
    );
  }
}

/**
 * We search our Algolia index from the server-side before we even respond to
 * an HTTP request.
 * @todo Remove the `JSON.parse(JSON.stringify(ob))` workaround.
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  const aspect: string = context.query.aspect as string;
  const subjects: string = context.query.subjects as string;
  const availability: string = context.query.availability as string;
  const query: Query = {
    aspect: aspect ? (decodeURIComponent(aspect) as Aspect) : 'mentoring',
    subjects: subjects ? JSON.parse(decodeURIComponent(subjects)) : [],
    availability: availability
      ? Availability.fromURLParam(availability)
      : new Availability(),
  };
  const url: string = new URL('/api/search', `http:${context.req.headers.host}`)
    .href;
  return {
    props: {
      query: JSON.parse(JSON.stringify(query)),
      results: JSON.parse(JSON.stringify(await getSearchResults(query, url))),
      ...(await getIntlProps(context)),
    },
  };
};

function SearchPage({ query, results }: SearchPageProps): JSX.Element {
  const [searching, setSearching] = React.useState<boolean>(false);
  const [res, setResults] = React.useState<ReadonlyArray<User>>(
    results.map((res: UserJSONInterface) => User.fromJSON(res))
  );
  const [qry, setQuery] = React.useState<Query>({
    aspect: query.aspect,
    subjects: query.subjects,
    availability: Availability.fromJSON(query.availability),
  });
  return (
    <>
      <Header
        aspect={qry.aspect}
        onChange={async (aspect: Aspect) => {
          setQuery({ ...qry, aspect });
          setSearching(true);
          setResults(await getSearchResults({ ...qry, aspect }));
          setSearching(false);
        }}
      />
      <Search
        query={qry}
        searching={searching}
        results={res}
        onChange={async (query: Query) => {
          setQuery(query);
          setSearching(true);
          setResults(await getSearchResults(query));
          setSearching(false);
        }}
      />
      <Footer />
      <Intercom />
    </>
  );
}

export default withIntl<SearchPageProps>(SearchPage);
