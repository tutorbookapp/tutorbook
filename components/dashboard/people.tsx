import { v4 as uuid } from 'uuid';
import useSWR, { mutate } from 'swr';
import useTranslation from 'next-translate/useTranslation';

import { TextField } from '@rmwc/textfield';
import { Snackbar } from '@rmwc/snackbar';
import { Select } from '@rmwc/select';
import { IconButton } from '@rmwc/icon-button';
import { ChipSet, Chip } from '@rmwc/chip';
import { ListUsersRes } from 'lib/api/list-users';
import { Option, UsersQuery, Org, User, Tag } from 'lib/model';
import { IntercomAPI } from 'components/react-intercom';

import React, { useMemo, useEffect, useState } from 'react';
import Result from 'components/search/result';
import UserDialog from 'components/user-dialog';

import Title from './title';
import Placeholder from './placeholder';
import FilterDialog from './filter-dialog';

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
  const [filtering, setFiltering] = useState<boolean>(false);
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
    setQuery((prev: UsersQuery) => {
      return new UsersQuery({
        ...prev,
        orgs: [{ label: org.name, value: org.id }],
      });
    });
  }, [org]);
  useEffect(() => {
    void mutate(query.endpoint);
  }, [query]);
  useEffect(() => {
    setSearching((prev: boolean) => prev && (isValidating || !data));
  }, [isValidating, data]);

  return (
    <>
      {filtering && (
        <FilterDialog
          onClosed={() => setFiltering(false)}
          onChange={(updated: UsersQuery) => {
            setSearching(true);
            setQuery(updated);
          }}
          value={query}
        />
      )}
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
          open={viewingSnackbar}
          className={styles.snackbar}
          onClose={() => setViewingSnackbar(false)}
          message={t('people:link-copied')}
          dismissIcon
          leading
        />
      )}
      <Title
        header={t('common:people')}
        body={t('people:subtitle', { name: org.name })}
        actions={[
          {
            label: t('people:create-user'),
            onClick: () => setCreating(true),
          },
          {
            label: t('people:share-signup-link'),
            onClick: async () => {
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
                if (!navigator.clipboard)
                  return fallbackCopyTextToClipboard(text);
                return navigator.clipboard.writeText(text);
              }
              await copyTextToClipboard(
                `${window.location.protocol}//${window.location.host}/${org.id}`
              );
              setViewingSnackbar(true);
            },
          },
          {
            label: t('people:import-data-btn'),
            onClick: () =>
              IntercomAPI('showNewMessage', t('people:import-data-msg')),
          },
        ]}
      />
      <div className={styles.wrapper}>
        <div className={styles.filters}>
          <div className={styles.left}>
            <IconButton
              className={styles.filtersButton}
              icon='filter_list'
              onClick={() => setFiltering(true)}
            />
            <ChipSet className={styles.filterChips}>
              <Chip
                label={t('people:filters-not-vetted')}
                checkmark
                onInteraction={() => {
                  setSearching(true);
                  const tags: Option<Tag>[] = Array.from(query.tags);
                  const idx = tags.findIndex((a) => a.value === 'not-vetted');
                  if (idx < 0) {
                    tags.push({
                      label: t('people:filters-not-vetted'),
                      value: 'not-vetted',
                    });
                  } else {
                    tags.splice(idx, 1);
                  }
                  setQuery((p) => new UsersQuery({ ...p, tags, page: 0 }));
                }}
                selected={
                  query.tags.findIndex((a) => a.value === 'not-vetted') >= 0
                }
              />
              <Chip
                label={t('people:filters-visible')}
                checkmark
                onInteraction={() => {
                  setSearching(true);
                  const { visible: prev } = query;
                  const visible = prev !== true ? true : undefined;
                  setQuery((p) => new UsersQuery({ ...p, visible, page: 0 }));
                }}
                selected={query.visible === true}
              />
              <Chip
                label={t('people:filters-hidden')}
                checkmark
                onInteraction={() => {
                  setSearching(true);
                  const { visible: prev } = query;
                  const visible = prev !== false ? false : undefined;
                  setQuery((p) => new UsersQuery({ ...p, visible, page: 0 }));
                }}
                selected={query.visible === false}
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
                setSearching(true);
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
                onChange={(event: React.FormEvent<HTMLSelectElement>) => {
                  setSearching(true);
                  const hitsPerPage = Number(event.currentTarget.value);
                  setQuery(
                    (p) => new UsersQuery({ ...p, hitsPerPage, page: 0 })
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
                setQuery((p) => new UsersQuery({ ...p, page: p.page - 1 }));
              }}
            />
            <IconButton
              disabled={
                query.page + 1 >= (data ? data.hits : 0) / query.hitsPerPage
              }
              icon='chevron_right'
              onClick={() => {
                setSearching(true);
                setQuery((p) => new UsersQuery({ ...p, page: p.page + 1 }));
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
