import React from 'react';
import { NextRouter, useRouter } from 'next/router';

import Header from '../header';
import Footer from '../footer';
import Search from '../search';

import { FiltersInterface, Availability } from '../model';

export default function SearchPage(): JSX.Element {
  const router: NextRouter = useRouter();
  const params: Record<string, string> = router.query as Record<string, string>;
  const filters: FiltersInterface = {
    subjects: [],
    availability: new Availability(),
  };
  if (params.subjects)
    filters.subjects = JSON.parse(decodeURIComponent(params.subjects));
  if (params.availability)
    filters.availability = Availability.fromURLParam(params.availability);
  return (
    <>
      <Header white />
      <Search filters={filters} />
      <Footer />
    </>
  );
}
