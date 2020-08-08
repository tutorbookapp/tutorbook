import { v4 as uuid } from 'uuid';
import useSWR, { mutate } from 'swr';
import useTranslation from 'next-translate/useTranslation';

import { IconButton } from '@rmwc/icon-button';
import { TextField } from '@rmwc/textfield';
import { Snackbar } from '@rmwc/snackbar';
import { Select } from '@rmwc/select';
import { ChipSet, Chip } from '@rmwc/chip';
import { ListUsersRes } from 'lib/api/list-users';
import {
  Availability,
  UserJSON,
  CallbackParam,
  Option,
  UsersQuery,
  Org,
  User,
  Tag,
} from 'lib/model';
import { MatchingContext } from 'lib/matching';
import { IntercomAPI } from 'components/react-intercom';

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import UserDialog from 'components/user-dialog';
import FilterForm from 'components/filter-form';
import Result from 'components/search/result';
import Header from 'components/header';
import Placeholder from 'components/placeholder';
import Utils from 'lib/utils';

import Matching from './matching';

import styles from './people.module.scss';

interface PeopleProps {
  org: Org;
}

/**
 * The "People" view is a heterogenous combination of live-updating filtered
 * results and editability (similar to Google Sheets):
 * - Data automatically re-validates when filters are valid.
 * - Filters become invalid when data is edited or new users are being created.
 * - Creating new users locally updates the SWR data and calls the `/api/users`
 * API endpoint when the user has a valid email address.
 * - Local edits are pushed to remote after 5secs of no change.
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/87}
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/75}
 */
export default function People({ org }: PeopleProps): JSX.Element {
  const [searching, setSearching] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [viewingIdx, setViewingIdx] = useState<number>();
  const [viewingSnackbar, setViewingSnackbar] = useState<boolean>(false);
  const [query, setQuery] = useState<UsersQuery>(
    new UsersQuery({
      orgs: [{ label: org.name, value: org.id }],
      hitsPerPage: 10,
    })
  );

  const loadingRows: JSX.Element[] = useMemo(
    () =>
      Array(query.hitsPerPage)
        .fill(null)
        .map(() => <Result loading key={uuid()} />),
    [query.hitsPerPage]
  );

  const { t } = useTranslation();
  const { data, isValidating } = useSWR<ListUsersRes>(query.endpoint);

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
    setSearching(true);
    void mutate(query.endpoint);
  }, [query]);
  useEffect(() => {
    setSearching((prev: boolean) => prev && (isValidating || !data));
  }, [isValidating, data]);

  // Header action button callbacks.
  const createUser = useCallback(() => setCreating(true), []);
  const copySignupLink = useCallback(async () => {
    function fallbackCopyTextToClipboard(text: string): void {
      const textArea = document.createElement('textarea');
      textArea.value = text;

      // Avoid scrolling to bottom
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
      }

      document.body.removeChild(textArea);
    }
    async function copyTextToClipboard(text: string): Promise<void> {
      if (!navigator.clipboard) return fallbackCopyTextToClipboard(text);
      return navigator.clipboard.writeText(text);
    }
    await copyTextToClipboard(
      `${window.location.protocol}//${window.location.host}/${org.id}`
    );
    setViewingSnackbar(true);
  }, [org.id]);
  const importData = useCallback(() => {
    return IntercomAPI('showNewMessage', t('people:import-data-msg'));
  }, [t]);

  // Filter chip callbacks.
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
  }, [t]);
  const toggleVisibleFilter = useCallback(() => {
    setQuery((prev: UsersQuery) => {
      const { visible: vprev } = prev;
      const visible = vprev !== true ? true : undefined;
      return new UsersQuery({ ...prev, visible, page: 0 });
    });
  }, []);
  const toggleHiddenFilter = useCallback(() => {
    setQuery((prev: UsersQuery) => {
      const { visible: vprev } = prev;
      const visible = vprev !== false ? false : undefined;
      return new UsersQuery({ ...prev, visible, page: 0 });
    });
  }, []);

  // Pagination callbacks.
  const onHitsPerPageChange = useCallback(
    (event: React.FormEvent<HTMLSelectElement>) => {
      const hitsPerPage = Number(event.currentTarget.value);
      setQuery((prev) => new UsersQuery({ ...prev, hitsPerPage, page: 0 }));
    },
    []
  );
  const pageLeft = useCallback(() => {
    setQuery((prev) => new UsersQuery({ ...prev, page: prev.page - 1 }));
  }, []);
  const pageRight = useCallback(() => {
    setQuery((prev) => new UsersQuery({ ...prev, page: prev.page + 1 }));
  }, []);

  return (
    <>
      {creating && (
        <UserDialog onClosed={() => setCreating(false)} initialPage='edit' />
      )}
      {data && viewingIdx !== undefined && (
        <UserDialog
          onClosed={() => setViewingIdx(undefined)}
          initialData={data.users[viewingIdx]}
          initialPage='display'
        />
      )}
      {viewingSnackbar && (
        <Snackbar
          className={styles.snackbar}
          onClose={() => setViewingSnackbar(false)}
          message={t('people:link-copied')}
          dismissIcon
          leading
          open
        />
      )}
      <Header
        header={t('common:people')}
        body={t('people:subtitle', { name: org.name })}
        actions={[
          {
            label: t('people:create-user'),
            onClick: createUser,
          },
          {
            label: t('people:share-signup-link'),
            onClick: copySignupLink,
          },
          {
            label: t('common:import-data'),
            onClick: importData,
          },
        ]}
      />
      <div className={styles.wrapper}>
        <div className={styles.filters}>
          <div className={styles.left}>
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
              onChange={(event: React.FormEvent<HTMLInputElement>) => {
                const q: string = event.currentTarget.value;
                setQuery((p) => new UsersQuery({ ...p, query: q, page: 0 }));
              }}
            />
          </div>
        </div>
        {!searching &&
          (data ? data.users : []).map((user, idx) => (
            <Result
              user={User.fromJSON(user)}
              key={user.id}
              onClick={() => setViewingIdx(idx)}
            />
          ))}
        {searching && loadingRows}
        {!searching && !(data ? data.users : []).length && (
          <div className={styles.empty}>
            <Placeholder>{t('people:empty')}</Placeholder>
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
                onChange={onHitsPerPageChange}
              />
            </div>
            <div className={styles.pageNumber}>
              {query.getPaginationString(data ? data.hits : 0)}
            </div>
            <IconButton
              disabled={query.page <= 0}
              icon='chevron_left'
              onClick={pageLeft}
            />
            <IconButton
              disabled={
                query.page + 1 >= (data ? data.hits : 0) / query.hitsPerPage
              }
              icon='chevron_right'
              onClick={pageRight}
            />
          </div>
        </div>
      </div>
    </>
  );
}
