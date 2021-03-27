import { useCallback, useEffect, useState } from 'react';
import Router from 'next/router';
import { dequal } from 'dequal/lite';

import Pagination from 'components/pagination';

import { CallbackParam } from 'lib/model/callback';
import { UsersQuery } from 'lib/model/query/users';
import { useOrg } from 'lib/context/org';

import FiltersSheet from './filters-sheet';
import Header from './header';
import ResultsList from './results-list';
import SearchBar from './search-bar';
import styles from './users.module.scss';

/**
 * The "Users" view is a fully filterable list of users that can be clicked on
 * to open a user display page that includes:
 * - Profile editing
 * - Convenient contact actions (i.e. email a certain user)
 * This component merely acts as a shared state provider by passing down state
 * variables and their corresponding `setState` callbacks.
 * @todo Ensure that child components are wrapped in `React.memo`s so that they
 * don't re-render due to irrelevant state changes.
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/87}
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/75}
 */
export default function Users(): JSX.Element {
  const { org } = useOrg();

  const [searching, setSearching] = useState<boolean>(true);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<UsersQuery>(
    new UsersQuery({
      orgs: org ? [org.id] : [],
      aspect: org?.aspects[0] || 'tutoring',
      hitsPerPage: 5,
    })
  );
  const [hits, setHits] = useState<number>(query.hitsPerPage);

  const onQueryChange = useCallback((param: CallbackParam<UsersQuery>) => {
    setQuery((prev) => {
      let updated = prev;
      if (typeof param === 'object') updated = param;
      if (typeof param === 'function') updated = param(updated);
      if (dequal(updated, prev)) return prev;
      setSearching(true);
      return updated;
    });
  }, []);

  useEffect(() => {
    // TODO: Ideally, we'd be able to use Next.js's `useRouter` hook to get the
    // URL query parameters, but right now, it doesn't seem to be working. Once
    // we do replace this with the `useRouter` hook, we'll be able to replace
    // state management with just shallowly updating the URL.
    // @see {@link https://github.com/vercel/next.js/issues/17112}
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setQuery(UsersQuery.fromURLParams(Object.fromEntries(params.entries())));
  }, []);

  // TODO: Use the built-in Next.js router hook to manage this query state and
  // show the `NProgress` loader when the results are coming in.
  useEffect(() => {
    if (!org || !org.id) return;
    const url = query.getURL(`/${org.id}/users`);
    void Router.replace(url, undefined, { shallow: true });
  }, [org, query]);

  useEffect(() => {
    onQueryChange((prev) => {
      if (!org) return prev;
      const aspect = org.aspects.includes(prev.aspect)
        ? prev.aspect
        : org.aspects[0];
      return new UsersQuery({ ...prev, orgs: [org.id], aspect });
    });
  }, [org, onQueryChange]);

  return (
    <>
      <Header orgId={org?.id || ''} orgName={org?.name || ''} />
      <div className={styles.wrapper}>
        <SearchBar
          query={query}
          setQuery={onQueryChange}
          setOpen={setFiltersOpen}
        />
        <div className={styles.content}>
          <FiltersSheet
            open={filtersOpen}
            query={query}
            setQuery={onQueryChange}
          />
          <ResultsList
            searching={searching}
            setSearching={setSearching}
            open={filtersOpen}
            query={query}
            setHits={setHits}
          />
        </div>
        <Pagination
          query={query}
          model={UsersQuery}
          setQuery={onQueryChange}
          hits={hits}
        />
      </div>
    </>
  );
}
