import { IconButton } from '@rmwc/icon-button';
import { TextField } from '@rmwc/textfield';

import { Callback, MeetingsQuery } from 'lib/model';

import styles from './search-bar.module.scss';

export interface SearchBarProps {
  query: MeetingsQuery;
  setQuery: Callback<MeetingsQuery>;
  setFiltersOpen: Callback<boolean>;
}

export default function SearchBar({
  query,
  setQuery,
  setFiltersOpen,
}: SearchBarProps): JSX.Element {
  return (
    <div className={styles.filters}>
      <div className={styles.left}>
        <IconButton
          className={styles.filtersButton}
          onClick={() => setFiltersOpen((prev) => !prev)}
          icon='filter_list'
        />
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
