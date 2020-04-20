import React from 'react';
import { GetServerSideProps } from 'next';

import CovidHead from '../head';
import Header from '../header';
import Footer from '../footer';
import Search from '../search';

import {
  User,
  FiltersInterface,
  FiltersJSONInterface,
  Availability,
} from '../model';

interface SearchPageProps {
  filters: FiltersJSONInterface;
  results: ReadonlyArray<User>;
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
  const results: ReadonlyArray<User> = await Search.search(filters);
  return {
    props: {
      filters: JSON.parse(JSON.stringify(filters)),
      results: JSON.parse(JSON.stringify(results)),
    },
  };
};

export default function SearchPage(props: SearchPageProps): JSX.Element {
  const filters: FiltersInterface = {
    subjects: props.filters.subjects,
    availability: Availability.fromJSON(props.filters.availability),
  };
  const results: ReadonlyArray<User> = props.results.map(
    (res) => new User(res)
  );
  return (
    <>
      <CovidHead />
      <Header white />
      <Search filters={filters} results={results} />
      <Footer />
    </>
  );
}
