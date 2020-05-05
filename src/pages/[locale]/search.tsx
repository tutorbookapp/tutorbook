import React from 'react';
import { GetServerSideProps } from 'next';
import { AxiosResponse, AxiosError } from 'axios';

import to from 'await-to-js';
import axios from 'axios';

import Header from '../../header';
import Footer from '../../footer';
import Search from '../../search';

import { getIntlProps, withIntl } from '../../intl';
import {
  User,
  UserJSONInterface,
  FiltersInterface,
  FiltersJSONInterface,
  Availability,
} from '../../model';

interface SearchPageProps {
  filters: FiltersJSONInterface;
  results: ReadonlyArray<UserJSONInterface>;
}

/**
 * We search our Algolia index from the server-side before we even respond to
 * an HTTP request.
 * @todo Remove the `JSON.parse(JSON.stringify(ob))` workaround.
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  const subjects: string = context.query.subjects as string;
  const availability: string = context.query.availability as string;
  const filters: FiltersInterface = {
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
        filters: JSON.parse(JSON.stringify(filters)),
        results: JSON.parse(JSON.stringify(res.data)),
        ...(await getIntlProps(context)),
      },
    };
  } else {
    console.warn('[WARNING] No error or response from search REST API.');
    return {
      props: {
        filters: JSON.parse(JSON.stringify(filters)),
        ...(await getIntlProps(context)),
      },
    };
  }
};

function SearchPage(props: SearchPageProps): JSX.Element {
  const filters: FiltersInterface = {
    subjects: props.filters.subjects,
    availability: Availability.fromJSON(props.filters.availability),
  };
  const results: ReadonlyArray<User> = props.results.map(
    (user: UserJSONInterface) => User.fromJSON(user)
  );
  return (
    <>
      <Header white />
      <Search filters={filters} results={results} />
      <Footer />
    </>
  );
}

export default withIntl<SearchPageProps>(SearchPage);
