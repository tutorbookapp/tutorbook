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
  QueryJSONInterface,
  Availability,
} from '@tutorbook/model';

interface SearchPageProps {
  query: QueryJSONInterface;
  results: ReadonlyArray<UserJSONInterface>;
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
  const [err, res] = await to<AxiosResponse, AxiosError>(
    axios({
      method: 'get',
      url: new URL('/api/search', `http://${context.req.headers.host}`).href,
      params: {
        aspect: context.query.aspect,
        subjects: context.query.subjects,
        availability: context.query.availability,
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
  } else if (res) {
    return {
      props: {
        query: JSON.parse(JSON.stringify(query)),
        results: JSON.parse(JSON.stringify(res.data)),
        ...(await getIntlProps(context)),
      },
    };
  } else {
    console.warn('[WARNING] No error or response from search REST API.');
    return {
      props: {
        query: JSON.parse(JSON.stringify(query)),
        ...(await getIntlProps(context)),
      },
    };
  }
};

function SearchPage({ query, results }: SearchPageProps): JSX.Element {
  const [qry, setQuery] = React.useState<Query>({
    aspect: query.aspect,
    subjects: query.subjects,
    availability: Availability.fromJSON(query.availability),
  });
  return (
    <>
      <Header
        aspect={qry.aspect}
        onChange={(aspect: Aspect) => setQuery({ ...qry, aspect })}
      />
      <Search
        query={qry}
        results={results.map((res: UserJSONInterface) => User.fromJSON(res))}
      />
      <Footer />
      <Intercom />
    </>
  );
}

export default withIntl<SearchPageProps>(SearchPage);
