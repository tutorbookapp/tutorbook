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
import { TextField } from '@rmwc/textfield';
import { Snackbar } from '@rmwc/snackbar';
import { Select } from '@rmwc/select';
import { IconButton } from '@rmwc/icon-button';
import { ChipSet, Chip } from '@rmwc/chip';
import { ListUsersRes } from 'lib/api/list-users';
import { Option, Query, Org, UserJSON, Tag } from 'lib/model';
import { IntercomAPI } from 'components/react-intercom';
import { defMsg, useMsg, useIntl, IntlHelper } from 'lib/intl';

import React from 'react';
import VerificationDialog from 'components/verification-dialog';

import Title from './title';
import UserRow, { LoadingRow } from './user-row';
import Placeholder from './placeholder';

import styles from './people.module.scss';

const msgs = defMsg({
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

export default function People({ initialData, org }: PeopleProps): JSX.Element {
  const msg: IntlHelper = useMsg();
  const timeoutIds = React.useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  const [viewingIdx, setViewingIdx] = React.useState<number>();
  const [viewingSnackbar, setViewingSnackbar] = React.useState<boolean>(false);
  const [query, setQuery] = React.useState<Query>(
    new Query({ orgs: [{ label: org.name, value: org.id }], hitsPerPage: 10 })
  );

  const { locale } = useIntl();
  const { data, isValidating } = useSWR<ListUsersRes>(query.endpoint, {
    initialData,
  });

  React.useEffect(() => {
    setQuery(
      (prev: Query) =>
        new Query({ ...prev, orgs: [{ label: org.name, value: org.id }] })
    );
  }, [org]);
  React.useEffect(() => {
    void mutate(query.endpoint);
  }, [query]);

  async function mutateUser(user: UserJSON): Promise<void> {
    if (timeoutIds.current[user.id]) {
      clearTimeout(timeoutIds.current[user.id]);
      delete timeoutIds.current[user.id];
    }

    /* eslint-disable @typescript-eslint/require-await */
    const updateLocal = (updated: UserJSON) =>
      mutate(
        query.endpoint,
        async (prev: ListUsersRes) => {
          if (!prev) return prev;
          const { users: old } = prev;
          const idx: number = old.findIndex(
            (u: UserJSON) => u.id === updated.id
          );
          if (idx < 0) return prev;
          const users = [...old.slice(0, idx), updated, ...old.slice(idx + 1)];
          return { ...prev, users };
        },
        false
      );
    /* eslint-enable @typescript-eslint/require-await */

    const updateRemote = async (updated: UserJSON) => {
      const url = `/api/users/${updated.id}`;
      const { data: remoteUpdated } = await axios.put<UserJSON>(url, updated);
      await updateLocal(remoteUpdated);
    };

    await updateLocal(user);

    // Only update the user profile remotely after 5secs of no change.
    // @see {@link https://github.com/vercel/swr/issues/482}
    timeoutIds.current[user.id] = setTimeout(() => {
      void updateRemote(user);
    }, 5000);
  }

  return (
    <>
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
        header='People'
        body={`${org.name}'s tutors, mentors and students`}
        actions={[
          {
            label: msg(msgs.viewSearch),
            href: '/[org]/search/[[...slug]]',
            as: `/${org.id}/search`,
          },
          {
            label: msg(msgs.importData),
            onClick: () =>
              IntercomAPI('showNewMessage', "I'd like to import data."),
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
        ]}
      />
      <div className={styles.wrapper}>
        <div className={styles.filters}>
          <div className={styles.left}>
            <IconButton className={styles.filtersButton} icon='filter_list' />
            <ChipSet className={styles.filterChips}>
              <Chip
                label={msg(msgs.notVetted)}
                checkmark
                onInteraction={() => {
                  const tags: Option<Tag>[] = Array.from(query.tags);
                  const idx = tags.findIndex(
                    ({ value }) => value === 'not-vetted'
                  );
                  if (idx < 0) {
                    tags.push({
                      label: msg(msgs.notVetted),
                      value: 'not-vetted',
                    });
                  } else {
                    tags.splice(idx, 1);
                  }
                  setQuery((prev: Query) => new Query({ ...prev, tags }));
                }}
                selected={
                  query.tags.findIndex(({ value }) => value === 'not-vetted') >=
                  0
                }
              />
              <Chip
                label={msg(msgs.visible)}
                checkmark
                onInteraction={() => {
                  const visible = query.visible !== true ? true : undefined;
                  setQuery((prev: Query) => new Query({ ...prev, visible }));
                }}
                selected={query.visible === true}
              />
              <Chip
                label={msg(msgs.hidden)}
                checkmark
                onInteraction={() => {
                  const visible = query.visible !== false ? false : undefined;
                  setQuery((prev: Query) => new Query({ ...prev, visible }));
                }}
                selected={query.visible === false}
              />
            </ChipSet>
          </div>
          <div className={styles.right}>
            <TextField
              outlined
              placeholder='Search'
              className={styles.searchField}
              value={query.query}
              onChange={(event: React.FormEvent<HTMLInputElement>) => {
                const text: string = event.currentTarget.value;
                setQuery((prev: Query) => new Query({ ...prev, query: text }));
              }}
            />
          </div>
        </div>
        {(isValidating || !!(data ? data.users : []).length) && (
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
                {!!data &&
                  !!data.users.length &&
                  data.users.map((user: UserJSON, idx: number) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onChange={mutateUser}
                      onClick={() => setViewingIdx(idx)}
                    />
                  ))}
                {(!data || !data.users.length) &&
                  isValidating &&
                  Array(10)
                    .fill(null)
                    .map(() => <LoadingRow key={uuid()} />)}
              </DataTableBody>
            </DataTableContent>
          </DataTable>
        )}
        {!isValidating && !(data ? data.users : []).length && (
          <div className={styles.empty}>
            <Placeholder>NO PEOPLE TO SHOW</Placeholder>
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
                  setQuery(
                    (prev: Query) => new Query({ ...prev, hitsPerPage })
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
              onClick={() =>
                setQuery(
                  (prev: Query) => new Query({ ...prev, page: prev.page - 1 })
                )
              }
            />
            <IconButton
              disabled={
                query.page + 1 >= (data ? data.hits : 0) / query.hitsPerPage
              }
              icon='chevron_right'
              onClick={() =>
                setQuery(
                  (prev: Query) => new Query({ ...prev, page: prev.page + 1 })
                )
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
