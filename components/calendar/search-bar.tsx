import { IconButton } from '@rmwc/icon-button';
import { TextField } from '@rmwc/textfield';
import { useCallback } from 'react';

import { Callback, MeetingsQuery } from 'lib/model';

import styles from './search-bar.module.scss';

export interface SearchBarProps {
  query: MeetingsQuery;
  setQuery: Callback<MeetingsQuery>;
  setFiltersOpen: Callback<boolean>;
  byOrg?: boolean;
}

export default function SearchBar({
  query,
  setQuery,
  setFiltersOpen,
  byOrg,
}: SearchBarProps): JSX.Element {
  const downloadResults = useCallback(() => {
    window.open(query.getURL('/api/meetings/csv'));
  }, [query]);

  return (
    <div className={styles.filters}>
      <div className={styles.left}>
        {byOrg && (
          <IconButton
            className={styles.filtersButton}
            onClick={() => setFiltersOpen((prev) => !prev)}
            icon='filter_list'
          />
        )}
        {byOrg && <IconButton icon='download' onClick={downloadResults} />}
      </div>
      <div className={styles.right}>
        <TextField
          outlined
          placeholder='Search meetings'
          className={styles.searchField}
          value={query.search}
          onChange={(evt) => {
            const search = evt.currentTarget.value;
            setQuery((prev) => new MeetingsQuery({ ...prev, search }));
          }}
        />
      </div>
    </div>
  );
}
