import { useCallback, useEffect, useMemo, useState } from 'react';

import UserDialog from 'components/user-dialog';

import {
  Availability,
  Option,
  Org,
  RequestJSON,
  UserJSON,
  UsersQuery,
} from 'lib/model';

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
  const [matching, setMatching] = useState<RequestJSON[]>([]);

  const onViewingClosed = useCallback(() => setViewing(undefined), []);

  useEffect(() => {
    setQuery(
      (prev: UsersQuery) =>
        new UsersQuery({
          ...prev,
          orgs: [{ label: org.name, value: org.id }],
        })
    );
  }, [org]);
  useEffect(() => {
    const subjects = matching.reduce((acc, cur) => {
      cur.subjects.forEach((subject: string) => acc.add(subject));
      return acc;
    }, new Set());
    const availability = matching.reduce((a, c) => {
      if (!c.times) return a;
      return new Availability(...a, ...Availability.fromJSON(c.times));
    }, new Availability());
    setQuery(
      (prev: UsersQuery) =>
        new UsersQuery({
          ...prev,
          availability,
          subjects: [...subjects].map((s) => ({ label: s, value: s })),
          query: '',
          page: 0,
        })
    );
  }, [matching]);

  const initialPage = useMemo(() => {
    if (!viewing || !viewing.id || viewing.id.startsWith('temp')) return 'edit';
    if (matching.length) return 'match';
    return 'display';
  }, [viewing, matching.length]);

  return (
    <>
      {viewing && (
        <UserDialog
          onClosed={onViewingClosed}
          initialData={viewing}
          initialPage={initialPage}
          setQuery={setQuery}
          matching={matching}
          setMatching={setMatching}
        />
      )}
      <Header orgId={org.id} orgName={org.name} setViewing={setViewing} />
      <div className={styles.wrapper}>
        <SearchBar query={query} setQuery={setQuery} setOpen={setFiltersOpen} />
        <div className={styles.content}>
          <FiltersSheet
            open={filtersOpen}
            query={query}
            setQuery={setQuery}
            matching={matching}
            setMatching={setMatching}
          />
          <ResultsList
            open={filtersOpen}
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
