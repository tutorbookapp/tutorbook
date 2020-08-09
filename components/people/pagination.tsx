import React, { useCallback } from 'react';
import { Callback, UsersQuery } from 'lib/model';
import { Select } from '@rmwc/select';
import { IconButton } from '@rmwc/icon-button';

import useTranslation from 'next-translate/useTranslation';

import styles from './pagination.module.scss';

export interface PaginationProps {
  hits: number;
  query: UsersQuery;
  setQuery: Callback<UsersQuery>;
}

export default function Pagination({
  hits,
  query,
  setQuery,
}: PaginationProps): JSX.Element {
  const onHitsPerPageChange = useCallback(
    (event: React.FormEvent<HTMLSelectElement>) => {
      const hitsPerPage = Number(event.currentTarget.value);
      setQuery((prev) => new UsersQuery({ ...prev, hitsPerPage, page: 0 }));
    },
    [setQuery]
  );
  const pageLeft = useCallback(() => {
    setQuery((prev) => new UsersQuery({ ...prev, page: prev.page - 1 }));
  }, [setQuery]);
  const pageRight = useCallback(() => {
    setQuery((prev) => new UsersQuery({ ...prev, page: prev.page + 1 }));
  }, [setQuery]);

  const { t } = useTranslation();

  return (
    <div className={styles.pagination}>
      <div className={styles.left} />
      <div className={styles.right}>
        <div className={styles.hitsPerPage}>
          {t('common:rows-per-page')}
          <Select
            enhanced
            value={`${query.hitsPerPage}`}
            options={['5', '10', '15', '20', '25', '30']}
            onChange={onHitsPerPageChange}
          />
        </div>
        <div className={styles.pageNumber}>
          {query.getPaginationString(hits)}
        </div>
        <IconButton
          disabled={query.page <= 0}
          icon='chevron_left'
          onClick={pageLeft}
        />
        <IconButton
          disabled={query.page + 1 >= hits / query.hitsPerPage}
          icon='chevron_right'
          onClick={pageRight}
        />
      </div>
    </div>
  );
}
