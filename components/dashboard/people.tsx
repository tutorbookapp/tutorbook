import { v4 as uuid } from 'uuid';
import useSWR, { mutate } from 'swr';
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
import { Option, Query, Org, User, UserJSON, Tag } from 'lib/model';
import { IntercomAPI } from 'components/react-intercom';
import { useMsg, useIntl, IntlHelper } from 'lib/intl';
import { defineMessages } from 'react-intl';

import React from 'react';
import VerificationDialog from 'components/verification-dialog';

import { UserRow, LoadingRow } from './user-row';

import Title from './title';
import Placeholder from './placeholder';

import styles from './people.module.scss';

const msgs = defineMessages({
  title: {
    id: 'people.title',
    defaultMessage: 'People',
  },
  subtitle: {
    id: 'people.subtitle',
    defaultMessage: "{name}'s tutors, mentors and students",
  },
  empty: {
    id: 'people.empty',
    defaultMessage: 'NO PEOPLE TO SHOW',
  },
  searchPlaceholder: {
    id: 'people.filters.search-placeholder',
    defaultMessage: 'Search people',
  },
  viewSearch: {
    id: 'people.actions.view-search',
    defaultMessage: 'View search',
  },
  createUser: {
    id: 'people.actions.create-user',
    defaultMessage: 'Create user',
  },
  importData: {
    id: 'people.actions.import-data',
    defaultMessage: 'Import data',
  },
  importDataMsg: {
    id: 'people.actions.import-data-msg',
    defaultMessage: 'Could you help me import data?',
  },
  shareSignupLink: {
    id: 'people.actions.share-signup-link',
    defaultMessage: 'Share signup link',
  },
  notVetted: {
    id: 'people.filters.not-vetted',
    defaultMessage: 'Not yet vetted',
  },
  visible: {
    id: 'people.filters.visible',
    defaultMessage: 'Visible in search',
  },
  hidden: {
    id: 'people.filters.hidden',
    defaultMessage: 'Hidden from search',
  },
});

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
  const msg: IntlHelper = useMsg();
  const timeoutIds = React.useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  const [valid, setValid] = React.useState<boolean>(true);
  const [warningDialog, setWarningDialog] = React.useState<React.ReactNode>();
  const [searching, setSearching] = React.useState<boolean>(false);
  const [viewingIdx, setViewingIdx] = React.useState<number>();
  const [viewingSnackbar, setViewingSnackbar] = React.useState<boolean>(false);
  const [query, setQuery] = React.useState<Query>(
    new Query({ orgs: [{ label: org.name, value: org.id }], hitsPerPage: 10 })
  );

  const loadingRows: JSX.Element[] = React.useMemo(
    () =>
      Array(query.hitsPerPage)
        .fill(null)
        .map(() => <LoadingRow key={uuid()} />),
    [query.hitsPerPage]
  );

  const { locale } = useIntl();
  // TODO: Control the re-validation using the `valid` state variable.
  // See: https://github.com/vercel/swr/issues/529
  const { data, isValidating } = useSWR<ListUsersRes>(query.endpoint, {
    initialData,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  React.useEffect(() => {
    setQuery((prev: Query) => {
      return new Query({ ...prev, orgs: [{ label: org.name, value: org.id }] });
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
        const dialogMsgs = defineMessages({
          title: {
            id: 'people.warning-dialog.title',
            defaultMessage: 'Apply filters?',
          },
          body: {
            id: 'people.warning-dialog.body',
            defaultMessage:
              'Applying these filters will discard any users added without an' +
              ' email address. To save your changes, add an email address to ' +
              'each of those new users and then apply filters.',
          },
          accept: {
            id: 'people.warning-dialog.accept',
            defaultMessage: 'Apply Filters',
          },
          cancel: {
            id: 'people.warning-dialog.cancel',
            defaultMessage: 'Cancel',
          },
        });
        setWarningDialog(
          <SimpleDialog
            className={styles.dialog}
            title={msg(dialogMsgs.title)}
            body={msg(dialogMsgs.body)}
            acceptLabel={msg(dialogMsgs.accept)}
            cancelLabel={msg(dialogMsgs.cancel)}
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
    [valid, data, msg]
  );

  return (
    <>
      {warningDialog}
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
          message='Link copied to clipboard.'
          dismissIcon
          leading
        />
      )}
      <Title
        header={msg(msgs.title)}
        body={msg(msgs.subtitle, { name: org.name })}
        actions={[
          {
            label: msg(msgs.createUser),
            onClick: async () => {
              setValid(false); // Filters become invalid when creating users.
              const user = new User({
                id: `temp-${uuid()}`,
                orgs: ['default', org.id],
              }).toJSON();
              await mutate(
                query.endpoint,
                (prev?: ListUsersRes) => ({
                  hits: (prev ? prev.hits : 0) + 1,
                  users: [user, ...(prev ? prev.users : [])],
                }),
                false
              );
            },
          },
          {
            label: msg(msgs.importData),
            onClick: () =>
              IntercomAPI('showNewMessage', msg(msgs.importDataMsg)),
          },
          {
            label: msg(msgs.shareSignupLink),
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
                `http://${window.location.host}/${locale}/${org.id}/signup`
              );
              setViewingSnackbar(true);
            },
          },
          {
            label: msg(msgs.viewSearch),
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
                label={msg(msgs.notVetted)}
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
                        label: msg(msgs.notVetted),
                        value: 'not-vetted',
                      });
                    } else if (valid) {
                      tags.splice(idx, 1);
                    }
                    setQuery((p: Query) => new Query({ ...p, tags, page: 0 }));
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
                label={msg(msgs.visible)}
                checkmark
                onInteraction={() =>
                  filterCallback(() => {
                    setSearching(true);
                    const { visible: prev } = query;
                    const toggled = prev !== true ? true : undefined;
                    const visible = !valid && prev === true ? true : toggled;
                    setQuery(
                      (p: Query) => new Query({ ...p, visible, page: 0 })
                    );
                  })
                }
                selected={query.visible === true}
              />
              <Chip
                className={
                  !valid && query.visible === false ? styles.invalid : ''
                }
                label={msg(msgs.hidden)}
                checkmark
                onInteraction={() =>
                  filterCallback(() => {
                    setSearching(true);
                    const { visible: prev } = query;
                    const toggled = prev !== false ? false : undefined;
                    const visible = !valid && prev === false ? false : toggled;
                    setQuery(
                      (p: Query) => new Query({ ...p, visible, page: 0 })
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
              placeholder={msg(msgs.searchPlaceholder)}
              className={styles.searchField}
              value={query.query}
              onChange={(event: React.FormEvent<HTMLInputElement>) => {
                const q: string = event.currentTarget.value;
                filterCallback(() => {
                  setSearching(true);
                  setQuery(
                    (p: Query) => new Query({ ...p, query: q, page: 0 })
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
                    Visible
                  </DataTableHeadCell>
                  <DataTableHeadCell hasFormControl className={styles.vetted}>
                    Vetted
                  </DataTableHeadCell>
                  <DataTableHeadCell className={styles.name}>
                    Name
                  </DataTableHeadCell>
                  <DataTableHeadCell className={styles.bio}>
                    Bio
                  </DataTableHeadCell>
                  <DataTableHeadCell className={styles.email}>
                    Email
                  </DataTableHeadCell>
                  <DataTableHeadCell className={styles.phone}>
                    Phone
                  </DataTableHeadCell>
                  <DataTableHeadCell className={styles.subjects}>
                    Tutoring Subjects
                  </DataTableHeadCell>
                  <DataTableHeadCell className={styles.subjects}>
                    Mentoring Subjects
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
            <Placeholder>{msg(msgs.empty)}</Placeholder>
          </div>
        )}
        <div className={styles.pagination}>
          <div className={styles.left} />
          <div className={styles.right}>
            <div className={styles.hitsPerPage}>
              Rows per page:
              <Select
                enhanced
                value={`${query.hitsPerPage}`}
                options={['5', '10', '15', '20', '25', '30']}
                onChange={(event: React.FormEvent<HTMLSelectElement>) => {
                  const hitsPerPage = Number(event.currentTarget.value);
                  filterCallback(() => {
                    setSearching(true);
                    setQuery(
                      (p: Query) => new Query({ ...p, hitsPerPage, page: 0 })
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
                  setQuery((p: Query) => new Query({ ...p, page: p.page - 1 }));
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
                  setQuery((p: Query) => new Query({ ...p, page: p.page + 1 }));
                })
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
