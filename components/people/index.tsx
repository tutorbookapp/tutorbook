import { useCallback, useEffect, useState } from 'react';

import UserDialog from 'components/user-dialog';

import { Org, UserJSON, UsersQuery } from 'lib/model';

import FiltersSheet from './filters-sheet';
import Header from './header';
import ResultsList from './results-list';
import SearchBar from './search-bar';
import Pagination from './pagination';
import styles from './people.module.scss';

interface PeopleProps {
  org: Org;
}

/**
 * The "People" view is a fully filterable list of users that can be clicked on
 * to open a "UserDialog" that includes:
 * - Profile editing
 * - People matching (i.e. match and/or request creation)
 * - Convenient contact actions (i.e. email a certain user)
 * This component merely acts as a shared state provider by passing down state
 * variables and their corresponding `setState` callbacks.
 * @todo Ensure that child components are wrapped in `React.memo`s so that they
 * don't re-render due to irrelevant state changes (e.g. the matching queue).
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/87}
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/75}
 */
export default function People({ org }: PeopleProps): JSX.Element {
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<UsersQuery>(
    new UsersQuery({
      orgs: [{ label: org.name, value: org.id }],
      hitsPerPage: 5,
    })
  );
  const [hits, setHits] = useState<number>(query.hitsPerPage);
  const [viewing, setViewing] = useState<UserJSON>();

  const onClosed = useCallback(() => setViewing(undefined), []);

  useEffect(() => {
    setQuery(
      (prev: UsersQuery) =>
        new UsersQuery({
          ...prev,
          orgs: [{ label: org.name, value: org.id }],
        })
    );
  }, [org]);

  return (
    <>
      {viewing && (
        <UserDialog
          onClosed={onClosed}
          initialData={viewing}
          initialPage='display'
          setQuery={setQuery}
        />
      )}
      <Header orgId={org.id} orgName={org.name} />
      <div className={styles.wrapper}>
        <SearchBar query={query} setQuery={setQuery} setOpen={setFiltersOpen} />
        <div className={styles.content}>
          <FiltersSheet
            query={query}
            setQuery={setQuery}
            open={filtersOpen}
            setOpen={setFiltersOpen}
          />
          <ResultsList
            query={query}
            setHits={setHits}
            setViewing={setViewing}
          />
        </div>
        <Pagination query={query} setQuery={setQuery} hits={hits} />
      </div>
    </>
  );
}
