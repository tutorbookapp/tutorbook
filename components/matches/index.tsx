import {
  DataTable,
  DataTableBody,
  DataTableContent,
  DataTableHead,
  DataTableHeadCell,
  DataTableRow,
} from '@rmwc/data-table';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { TextField } from '@rmwc/textfield';
import { dequal } from 'dequal/lite';
import useSWR from 'swr';
import useTranslation from 'next-translate/useTranslation';
import { v4 as uuid } from 'uuid';

import Header from 'components/header';
import Pagination from 'components/pagination';
import Placeholder from 'components/placeholder';

import { CallbackParam, MatchesQuery } from 'lib/model';
import Intercom from 'lib/intercom';
import { ListMatchesRes } from 'lib/api/routes/matches/list';
import { useOrg } from 'lib/context/org';
import { useUser } from 'lib/context/user';

import { LoadingRow, MatchRow } from './row';
import styles from './matches.module.scss';

interface MatchesProps {
  org?: boolean;
  user?: boolean;
}

/**
 * The "Matches" view is a heterogenous combination of live-updating filtered
 * results and editability (similar to Google Sheets):
 * - Data automatically re-validates when filters are valid.
 * - Filters become invalid when data is edited.
 * - Local edits are pushed to remote after 5 secs of no change.
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/87}
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/75}
 */
export default function Matches({
  org: byOrg,
  user: byUser,
}: MatchesProps): JSX.Element {
  const { org } = useOrg();
  const { user } = useUser();

  const [searching, setSearching] = useState<boolean>(true);
  const [query, setQuery] = useState<MatchesQuery>();
  const [hits, setHits] = useState<number>(query?.hitsPerPage || 10);

  const onQueryChange = useCallback((param: CallbackParam<MatchesQuery>) => {
    setQuery((prev) => {
      let updated = prev || new MatchesQuery({ hitsPerPage: 10 });
      if (typeof param === 'object') updated = param;
      if (typeof param === 'function') updated = param(updated);
      if (dequal(updated, prev)) return prev;
      setSearching(true);
      return updated;
    });
  }, []);

  useEffect(() => {
    onQueryChange((prev) => {
      if (!org || !byOrg) return prev;
      return new MatchesQuery({ ...prev, org: org.id });
    });
  }, [byOrg, org, onQueryChange]);
  useEffect(() => {
    onQueryChange((prev) => {
      if (!user.id || !byUser) return prev;
      const people = [{ label: user.name, value: user.id }];
      return new MatchesQuery({ ...prev, people });
    });
  }, [byUser, user, onQueryChange]);

  const { t } = useTranslation();
  const { data, isValidating } = useSWR<ListMatchesRes>(
    query ? query.endpoint : null
  );

  useEffect(() => setHits((prev) => data?.hits || prev), [data?.hits]);
  useEffect(() => {
    setSearching((prev) => prev && (isValidating || !data));
  }, [isValidating, data]);

  // Throttle API requests when text-based search changes (i.e. don't send a new
  // request for every letter changed in the text-based search).
  const [search, setSearch] = useState<string>('');
  useEffect(() => {
    setSearching(true);
    const timeoutId = setTimeout(() => {
      setQuery((prev) => new MatchesQuery({ ...prev, query: search, page: 0 }));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const loadingRows: JSX.Element[] = useMemo(() => {
    const arr = Array(query?.hitsPerPage || 10).fill(null);
    return arr.map(() => <LoadingRow key={uuid()} />);
  }, [query?.hitsPerPage]);

  return (
    <>
      <Header
        header={t('common:matches')}
        body={
          byOrg
            ? t('matches:org-subtitle', { name: org?.name || '' })
            : t('matches:subtitle')
        }
        actions={[
          {
            label: t('common:import-data'),
            onClick: () =>
              Intercom('showNewMessage', t('matches:import-data-msg')),
          },
        ]}
      />
      <div className={styles.wrapper}>
        <div className={styles.filters}>
          <div className={styles.left} />
          <div className={styles.right}>
            <TextField
              outlined
              placeholder={t('matches:search-placeholder')}
              className={styles.searchField}
              value={search}
              onChange={(event: FormEvent<HTMLInputElement>) => {
                setSearch(event.currentTarget.value);
              }}
            />
          </div>
        </div>
        {(searching || !!(data ? data.matches : []).length) && (
          <DataTable className={styles.table}>
            <DataTableContent>
              <DataTableHead className={styles.header}>
                <DataTableRow>
                  <DataTableHeadCell className={styles.people}>
                    {t('common:people')}
                  </DataTableHeadCell>
                  <DataTableHeadCell className={styles.subjects}>
                    {t('common:subjects')}
                  </DataTableHeadCell>
                  <DataTableHeadCell className={styles.message}>
                    {t('common:message')}
                  </DataTableHeadCell>
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {!searching &&
                  (data?.matches || []).map((match) => (
                    <MatchRow match={match} key={match.id} />
                  ))}
                {searching && loadingRows}
              </DataTableBody>
            </DataTableContent>
          </DataTable>
        )}
        {!searching && !(data?.matches || []).length && (
          <div className={styles.empty}>
            <Placeholder>{t('matches:empty')}</Placeholder>
          </div>
        )}
        <Pagination
          model={MatchesQuery}
          setQuery={onQueryChange}
          query={query || new MatchesQuery({ hitsPerPage: 10 })}
          hits={hits}
        />
      </div>
    </>
  );
}
