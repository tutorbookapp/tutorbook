import { Chip, ChipSet } from '@rmwc/chip';
import { FormEvent, useCallback } from 'react';
import { IconButton } from '@rmwc/icon-button';
import { TextField } from '@rmwc/textfield';
import useTranslation from 'next-translate/useTranslation';

import { Callback, Option, Tag, UsersQuery } from 'lib/model';

import styles from './search-bar.module.scss';

export interface SearchBarProps {
  query: UsersQuery;
  setQuery: Callback<UsersQuery>;
  setOpen: Callback<boolean>;
}

export default function SearchBar({
  query,
  setQuery,
  setOpen,
}: SearchBarProps): JSX.Element {
  const { t } = useTranslation();

  const toggleFiltersOpen = useCallback(() => {
    setOpen((prev: boolean) => !prev);
  }, [setOpen]);
  const toggleVettedFilter = useCallback(() => {
    setQuery((prev: UsersQuery) => {
      const tags: Option<Tag>[] = Array.from(prev.tags);
      const idx = tags.findIndex((a) => a.value === 'not-vetted');
      if (idx < 0) {
        tags.push({
          label: t('people:filters-not-vetted'),
          value: 'not-vetted',
        });
      } else {
        tags.splice(idx, 1);
      }
      return new UsersQuery({ ...prev, tags, page: 0 });
    });
  }, [t, setQuery]);
  const toggleVisibleFilter = useCallback(() => {
    setQuery((prev: UsersQuery) => {
      const { visible: vprev } = prev;
      const visible = vprev !== true ? true : undefined;
      return new UsersQuery({ ...prev, visible, page: 0 });
    });
  }, [setQuery]);
  const toggleHiddenFilter = useCallback(() => {
    setQuery((prev: UsersQuery) => {
      const { visible: vprev } = prev;
      const visible = vprev !== false ? false : undefined;
      return new UsersQuery({ ...prev, visible, page: 0 });
    });
  }, [setQuery]);

  return (
    <div className={styles.filters}>
      <div className={styles.left}>
        <IconButton
          className={styles.filtersButton}
          onClick={toggleFiltersOpen}
          icon='filter_list'
        />
        <ChipSet className={styles.filterChips}>
          <Chip
            label={t('people:filters-not-vetted')}
            checkmark
            onInteraction={toggleVettedFilter}
            selected={
              query.tags.findIndex((a) => a.value === 'not-vetted') >= 0
            }
          />
          <Chip
            label={t('people:filters-visible')}
            checkmark
            onInteraction={toggleVisibleFilter}
            selected={query.visible === true}
          />
          <Chip
            label={t('people:filters-hidden')}
            checkmark
            onInteraction={toggleHiddenFilter}
            selected={query.visible === false}
          />
          <Chip
            label={t('common:mentors')}
            checkmark
            onInteraction={() => {
              const aspect = 'mentoring';
              setQuery((p) => new UsersQuery({ ...p, aspect, page: 0 }));
            }}
            selected={query.aspect === 'mentoring'}
          />
          <Chip
            label={t('common:tutors')}
            checkmark
            onInteraction={() => {
              const aspect = 'tutoring';
              setQuery((p) => new UsersQuery({ ...p, aspect, page: 0 }));
            }}
            selected={query.aspect === 'tutoring'}
          />
        </ChipSet>
      </div>
      <div className={styles.right}>
        <TextField
          outlined
          placeholder={t('people:search-placeholder')}
          className={styles.searchField}
          value={query.query}
          onChange={(event: FormEvent<HTMLInputElement>) => {
            const q: string = event.currentTarget.value;
            setQuery((p) => new UsersQuery({ ...p, query: q, page: 0 }));
          }}
        />
      </div>
    </div>
  );
}
