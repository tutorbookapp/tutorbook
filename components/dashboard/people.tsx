import { v4 as uuid } from 'uuid';
import useSWR, { mutate } from 'swr';
import useTranslation from 'next-translate/useTranslation';
import axios from 'axios';

import {
  DataTable,
  DataTableContent,
  DataTableHead,
  DataTableHeadCell,
  DataTableBody,
  DataTableRow,
} from '@rmwc/data-table';
import { SimpleDialog, DialogOnCloseEventT } from '@rmwc/dialog';
import { TextField } from '@rmwc/textfield';
import { Snackbar } from '@rmwc/snackbar';
import { Select } from '@rmwc/select';
import { IconButton } from '@rmwc/icon-button';
import { ChipSet, Chip } from '@rmwc/chip';
import { ListUsersRes } from 'lib/api/list-users';
import { Option, UsersQuery, Org, User, UserJSON, Tag } from 'lib/model';
import { IntercomAPI } from 'components/react-intercom';

import React from 'react';
import CreateUserDialog from 'components/create-user-dialog';
import VerificationDialog from 'components/verification-dialog';

import { UserRow, LoadingRow } from './user-row';

import Title from './title';
import Placeholder from './placeholder';

import styles from './dashboard.module.scss';

interface PeopleProps {
  initialData: ListUsersRes;
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
export default function People({ initialData, org }: PeopleProps): JSX.Element {
  const timeoutIds = React.useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  const [valid, setValid] = React.useState<boolean>(true);
  const [warningDialog, setWarningDialog] = React.useState<React.ReactNode>();
  const [searching, setSearching] = React.useState<boolean>(false);
  const [creating, setCreating] = React.useState<boolean>(false);
  const [viewingIdx, setViewingIdx] = React.useState<number>();
  const [viewingSnackbar, setViewingSnackbar] = React.useState<boolean>(false);
  const [query, setQuery] = React.useState<UsersQuery>(
    new UsersQuery({
      orgs: [{ label: org.name, value: org.id }],
      hitsPerPage: 10,
    })
  );

  const loadingRows: JSX.Element[] = React.useMemo(
    () =>
      Array(query.hitsPerPage)
        .fill(null)
        .map(() => <LoadingRow key={uuid()} />),
    [query.hitsPerPage]
  );

  const { t, lang: locale } = useTranslation();
  // TODO: Control the re-validation using the `valid` state variable.
  // See: https://github.com/vercel/swr/issues/529
  const { data, isValidating } = useSWR<ListUsersRes>(query.endpoint, {
    initialData,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  React.useEffect(() => {
    setQuery((prev: UsersQuery) => {
      return new UsersQuery({
        ...prev,
        orgs: [{ label: org.name, value: org.id }],
      });
    });
  }, [org]);
  React.useEffect(() => {
    void mutate(query.endpoint);
  }, [query]);
  React.useEffect(() => {
    setSearching((prev: boolean) => prev && isValidating);
  }, [isValidating]);
  React.useEffect(() => {
    setValid((prev: boolean) => prev || searching);
  }, [searching]);

  const mutateUser = React.useCallback(
    async (user: UserJSON) => {
      if (timeoutIds.current[user.id]) {
        clearTimeout(timeoutIds.current[user.id]);
        delete timeoutIds.current[user.id];
      }

      const updateLocal = async (updated: UserJSON, oldId?: string) => {
        await mutate(
          query.endpoint,
          (prev: ListUsersRes) => {
            if (!prev) return prev;
            const { users: old } = prev;
            const idx = old.findIndex((u) => u.id === (oldId || updated.id));
            if (idx < 0) return prev;
            const users = [
              ...old.slice(0, idx),
              updated,
              ...old.slice(idx + 1),
            ];
            return { ...prev, users };
          },
          false
        );
      };

      const updateRemote = async (updated: UserJSON) => {
        if (!updated.email) return;
        if (updated.id.startsWith('temp')) {
          const url = '/api/users';
          const { data: remoteData } = await axios.post<UserJSON>(url, {
            user: { ...updated, id: '' },
          });
          await updateLocal(remoteData, updated.id);
        } else {
          const url = `/api/users/${updated.id}`;
          const { data: remoteData } = await axios.put<UserJSON>(url, updated);
          await updateLocal(remoteData);
        }
      };

      setValid(false); // Filters become invalid when data is updated.
      await updateLocal(user);

      // Only update the user profile remotely after 5secs of no change.
      // @see {@link https://github.com/vercel/swr/issues/482}
      timeoutIds.current[user.id] = setTimeout(() => {
        void updateRemote(user);
      }, 5000);
    },
    [query]
  );

  type ActionCallback = () => void;
  const filterCallback = React.useCallback(
    (action: ActionCallback) => {
      const tempNoEmail = (u: UserJSON) => !u.email && u.id.startsWith('temp');
      if (!valid && data && data.users.some(tempNoEmail)) {
        setWarningDialog(
          <SimpleDialog
            className={styles.dialog}
            title={t('people:dialog-title')}
            body={t('people:dialog-body')}
            acceptLabel={t('people:dialog-accept-btn')}
            cancelLabel={t('people:dialog-cancel-btn')}
            onClose={(evt: DialogOnCloseEventT) => {
              if (evt.detail.action === 'accept') action();
            }}
            onClosed={() => setWarningDialog(undefined)}
            open
          />
        );
      } else {
        action();
      }
    },
    [valid, data, t]
  );

  return (
    <>
      {warningDialog}
      {creating && (
        <CreateUserDialog
          onClosed={() => setCreating(false)}
          initialData={data.users[0]}
          initialPage='edit'
        />
      )}
      {data && viewingIdx !== undefined && (
        <VerificationDialog
          user={data.users[viewingIdx]}
          onChange={mutateUser}
          onClosed={() => setViewingIdx(undefined)}
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
            onClick: async () => {
              setCreating(true);
              //setValid(false); // Filters become invalid when creating users.
              //const user = new User({
              //id: `temp-${uuid()}`,
              //orgs: ['default', org.id],
              //}).toJSON();
              //await mutate(
              //query.endpoint,
              //(prev?: ListUsersRes) => ({
              //hits: (prev ? prev.hits : 0) + 1,
              //users: [user, ...(prev ? prev.users : [])],
              //}),
              //false
              //);
            },
          },
          {
            label: t('people:import-data-btn'),
            onClick: () =>
              IntercomAPI('showNewMessage', t('people:import-data-msg')),
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
                `http://${window.location.host}/${locale}/${org.id}`
              );
              setViewingSnackbar(true);
            },
          },
          {
            label: t('people:view-search'),
            href: '/[org]/search/[[...slug]]',
            as: `/${org.id}/search`,
          },
        ]}
      />
      <div className={styles.wrapper}>
        <div className={styles.filters}>
          <div className={styles.left}>
            <IconButton className={styles.filtersButton} icon='filter_list' />
            <ChipSet className={styles.filterChips}>
              <Chip
                className={
                  !valid &&
                  query.tags.findIndex(({ value }) => value === 'not-vetted') >=
                    0
                    ? styles.invalid
                    : ''
                }
                label={t('people:filters-not-vetted')}
                checkmark
                onInteraction={() =>
                  filterCallback(() => {
                    setSearching(true);
                    const tags: Option<Tag>[] = Array.from(query.tags);
                    const idx = tags.findIndex(
                      ({ value }) => value === 'not-vetted'
                    );
                    if (idx < 0) {
                      tags.push({
                        label: t('people:filters-not-vetted'),
                        value: 'not-vetted',
                      });
                    } else if (valid) {
                      tags.splice(idx, 1);
                    }
                    setQuery(
                      (p: UsersQuery) => new UsersQuery({ ...p, tags, page: 0 })
                    );
                  })
                }
                selected={
                  query.tags.findIndex(({ value }) => value === 'not-vetted') >=
                  0
                }
              />
              <Chip
                className={
                  !valid && query.visible === true ? styles.invalid : ''
                }
                label={t('people:filters-visible')}
                checkmark
                onInteraction={() =>
                  filterCallback(() => {
                    setSearching(true);
                    const { visible: prev } = query;
                    const toggled = prev !== true ? true : undefined;
                    const visible = !valid && prev === true ? true : toggled;
                    setQuery(
                      (p: UsersQuery) =>
                        new UsersQuery({ ...p, visible, page: 0 })
                    );
                  })
                }
                selected={query.visible === true}
              />
              <Chip
                className={
                  !valid && query.visible === false ? styles.invalid : ''
                }
                label={t('people:filters-hidden')}
                checkmark
                onInteraction={() =>
                  filterCallback(() => {
                    setSearching(true);
                    const { visible: prev } = query;
                    const toggled = prev !== false ? false : undefined;
                    const visible = !valid && prev === false ? false : toggled;
                    setQuery(
                      (p: UsersQuery) =>
                        new UsersQuery({ ...p, visible, page: 0 })
                    );
                  })
                }
                selected={query.visible === false}
              />
            </ChipSet>
          </div>
          <div className={styles.right}>
            <TextField
              outlined
              invalid={!valid && !!query.query}
              placeholder={t('people:search-placeholder')}
              className={styles.searchField}
              value={query.query}
              onChange={(event: React.FormEvent<HTMLInputElement>) => {
                const q: string = event.currentTarget.value;
                filterCallback(() => {
                  setSearching(true);
                  setQuery(
                    (p: UsersQuery) =>
                      new UsersQuery({ ...p, query: q, page: 0 })
                  );
                });
              }}
            />
          </div>
        </div>
        {(searching || !!(data ? data.users : []).length) && (
          <DataTable className={styles.table}>
            <DataTableContent>
              <DataTableHead className={styles.header}>
                <DataTableRow>
                  <DataTableHeadCell hasFormControl className={styles.visible}>
                    {t('people:visible')}
                  </DataTableHeadCell>
                  <DataTableHeadCell hasFormControl className={styles.vetted}>
                    {t('people:vetted')}
                  </DataTableHeadCell>
                  <DataTableHeadCell className={styles.name}>
                    {t('people:name')}
                  </DataTableHeadCell>
                  <DataTableHeadCell className={styles.bio}>
                    {t('people:bio')}
                  </DataTableHeadCell>
                  <DataTableHeadCell className={styles.email}>
                    {t('people:email')}
                  </DataTableHeadCell>
                  <DataTableHeadCell className={styles.phone}>
                    {t('people:phone')}
                  </DataTableHeadCell>
                  <DataTableHeadCell className={styles.parents}>
                    {t('people:parents')}
                  </DataTableHeadCell>
                  <DataTableHeadCell className={styles.availability}>
                    {t('people:availability')}
                  </DataTableHeadCell>
                  <DataTableHeadCell className={styles.subjects}>
                    {t('people:tutoring-subjects')}
                  </DataTableHeadCell>
                  <DataTableHeadCell className={styles.subjects}>
                    {t('people:mentoring-subjects')}
                  </DataTableHeadCell>
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {!searching &&
                  (data ? data.users : []).map((user, idx) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onChange={mutateUser}
                      onClick={() => setViewingIdx(idx)}
                    />
                  ))}
                {searching && loadingRows}
              </DataTableBody>
            </DataTableContent>
          </DataTable>
        )}
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
                  const hitsPerPage = Number(event.currentTarget.value);
                  filterCallback(() => {
                    setSearching(true);
                    setQuery(
                      (p: UsersQuery) =>
                        new UsersQuery({ ...p, hitsPerPage, page: 0 })
                    );
                  });
                }}
              />
            </div>
            <div className={styles.pageNumber}>
              {query.getPaginationString(data ? data.hits : 0)}
            </div>
            <IconButton
              disabled={query.page <= 0}
              icon='chevron_left'
              onClick={() =>
                filterCallback(() => {
                  setSearching(true);
                  setQuery(
                    (p: UsersQuery) =>
                      new UsersQuery({ ...p, page: p.page - 1 })
                  );
                })
              }
            />
            <IconButton
              disabled={
                query.page + 1 >= (data ? data.hits : 0) / query.hitsPerPage
              }
              icon='chevron_right'
              onClick={() =>
                filterCallback(() => {
                  setSearching(true);
                  setQuery(
                    (p: UsersQuery) =>
                      new UsersQuery({ ...p, page: p.page + 1 })
                  );
                })
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
