import { Chip, ChipSet } from '@rmwc/chip';
import { FormEvent, memo } from 'react';
import { IconButton } from '@rmwc/icon-button';
import { TextField } from '@rmwc/textfield';
import useTranslation from 'next-translate/useTranslation';

import FilterListIcon from 'components/icons/filter-list';
import DownloadIcon from 'components/icons/download';

import { Callback } from 'lib/model/callback';
import { UsersQuery } from 'lib/model/query/users';

import styles from './search-bar.module.scss';

export interface SearchBarProps {
  query: UsersQuery;
  setQuery: Callback<UsersQuery>;
  setOpen: Callback<boolean>;
}

function SearchBar({ query, setQuery, setOpen }: SearchBarProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={styles.filters}>
      <div className={styles.left}>
        <IconButton
          data-cy='filters-button'
          className={styles.filtersButton}
          onClick={() => setOpen((prev) => !prev)}
          icon={<FilterListIcon />}
        />
        <IconButton
          data-cy='download-button'
          onClick={() => window.open(query.getURL('/api/users/csv'))}
          icon={<DownloadIcon />}
        />
        <ChipSet className={styles.filterChips}>
          <Chip
            label={t('users:filters-visible')}
            checkmark
            onInteraction={() => {
              setQuery((prev) => {
                const { visible: vprev } = prev;
                const visible = vprev !== true ? true : undefined;
                return new UsersQuery({ ...prev, visible, page: 0 });
              });
            }}
            selected={query.visible === true}
          />
          <Chip
            label={t('users:filters-hidden')}
            checkmark
            onInteraction={() => {
              setQuery((prev) => {
                const { visible: vprev } = prev;
                const visible = vprev !== false ? false : undefined;
                return new UsersQuery({ ...prev, visible, page: 0 });
              });
            }}
            selected={query.visible === false}
          />
          <Chip
            label={t('users:filters-available')}
            checkmark
            onInteraction={() => {
              setQuery((prev) => {
                const { available: aprev } = prev;
                const available = aprev === true ? undefined : true;
                return new UsersQuery({ ...prev, available, page: 0 });
              });
            }}
            selected={query.available === true}
          />
        </ChipSet>
      </div>
      <div className={styles.right}>
        <TextField
          outlined
          placeholder={t('users:search-placeholder')}
          className={styles.searchField}
          value={query.search}
          onChange={(event: FormEvent<HTMLInputElement>) => {
            const search = event.currentTarget.value;
            // TODO: Throttle the actual API requests but immediately show the
            // loading state (i.e. we can't just throttle `setQuery` updates).
            setQuery((p) => new UsersQuery({ ...p, search, page: 0 }));
          }}
        />
      </div>
    </div>
  );
}

export default memo(SearchBar);
