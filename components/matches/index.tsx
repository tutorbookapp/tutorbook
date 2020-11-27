import {
  DataTable,
  DataTableBody,
  DataTableContent,
  DataTableHead,
  DataTableHeadCell,
  DataTableRow,
} from '@rmwc/data-table';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { IconButton } from '@rmwc/icon-button';
import { Select } from '@rmwc/select';
import { TextField } from '@rmwc/textfield';
import useSWR from 'swr';
import useTranslation from 'next-translate/useTranslation';
import { v4 as uuid } from 'uuid';

import Header from 'components/header';
import Placeholder from 'components/placeholder';

import { MatchesQuery, Org } from 'lib/model';
import Intercom from 'lib/intercom';
import { ListMatchesRes } from 'lib/api/routes/matches/list';

import { LoadingRow, MatchRow } from './row';
import styles from './matches.module.scss';

interface MatchesProps {
  org?: Org;
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
export default function Matches({ org }: MatchesProps): JSX.Element {
  const [searching, setSearching] = useState<boolean>(true);
  const [query, setQuery] = useState<MatchesQuery>(
    new MatchesQuery({ org: org?.id || 'default', hitsPerPage: 10 })
  );

  useEffect(() => {
    setQuery((prev) => {
      if (!org) return prev;
      return new MatchesQuery({ ...prev, org: org.id });
    });
  }, [org]);

  // TODO: Reuse the `Pagination` component, save the hits from last page, and
  // prefetch the next page of results.
  const { data, isValidating } = useSWR<ListMatchesRes>(query.endpoint);

  useEffect(() => {
    setSearching((prev) => prev && (isValidating || !data));
  }, [isValidating, data]);

  const loadingRows: JSX.Element[] = useMemo(() => {
    const arr = Array(query.hitsPerPage).fill(null);
    return arr.map(() => <LoadingRow key={uuid()} />);
  }, [query.hitsPerPage]);

  const { t } = useTranslation();

  return (
    <>
      <Header
        header={t('common:matches')}
        body={t('matches:subtitle', { name: org?.name || '' })}
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
              value={query.query}
              onChange={(event: FormEvent<HTMLInputElement>) => {
                const q: string = event.currentTarget.value;
                setSearching(true);
                setQuery((p) => new MatchesQuery({ ...p, query: q, page: 0 }));
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
        <div className={styles.pagination}>
          <div className={styles.left} />
          <div className={styles.right}>
            <div className={styles.hitsPerPage}>
              {t('common:rows-per-page')}
              <Select
                enhanced
                value={`${query.hitsPerPage}`}
                options={['5', '10', '15', '20', '25', '30']}
                onChange={(event: FormEvent<HTMLSelectElement>) => {
                  const hitsPerPage = Number(event.currentTarget.value);
                  const page = 0;
                  setSearching(true);
                  setQuery(
                    (p) => new MatchesQuery({ ...p, hitsPerPage, page })
                  );
                }}
              />
            </div>
            <div className={styles.pageNumber}>
              {query.getPaginationString(data ? data.hits : 0)}
            </div>
            <IconButton
              disabled={query.page <= 0}
              icon='chevron_left'
              onClick={() => {
                setSearching(true);
                setQuery((p) => new MatchesQuery({ ...p, page: p.page - 1 }));
              }}
            />
            <IconButton
              disabled={
                query.page + 1 >= (data ? data.hits : 0) / query.hitsPerPage
              }
              icon='chevron_right'
              onClick={() => {
                setSearching(true);
                setQuery((p) => new MatchesQuery({ ...p, page: p.page + 1 }));
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
