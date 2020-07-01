import { v4 as uuid } from 'uuid';
import useSWR, { mutate as mutateSWR } from 'swr';

import {
  DataTable,
  DataTableContent,
  DataTableHead,
  DataTableHeadCell,
  DataTableBody,
  DataTableRow,
} from '@rmwc/data-table';
import { Snackbar } from '@rmwc/snackbar';
import { TextField } from '@rmwc/textfield';
import { IconButton } from '@rmwc/icon-button';
import { ChipSet, Chip } from '@rmwc/chip';
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
  people: UserJSON[];
  org: Org;
}

export default function People({ people, org }: PeopleProps): JSX.Element {
  const { locale } = useIntl();
  const msg: IntlHelper = useMsg();
  const [query, setQuery] = React.useState<Query>(
    new Query({ orgs: [{ label: org.name, value: org.id }] })
  );

  const { data: users, mutate, isValidating } = useSWR<UserJSON[]>(
    query.endpoint,
    { initialData: people }
  );

  const [selected, setSelected] = React.useState<string[]>([]);
  const [viewing, setViewing] = React.useState<UserJSON | undefined>();
  const [viewingSnackbar, setViewingSnackbar] = React.useState<boolean>(false);

  React.useEffect(() => {
    setQuery(
      (prev: Query) =>
        new Query({ ...prev, orgs: [{ label: org.name, value: org.id }] })
    );
  }, [org]);
  React.useEffect(() => {
    void mutateSWR(query.endpoint);
  }, [query]);

  /* eslint-disable-next-line @typescript-eslint/require-await */
  const update = (updated: UserJSON) =>
    mutate(async (prev: UserJSON[]) => {
      if (!prev) return prev;
      const idx: number = prev.findIndex((u) => u.id === updated.id);
      if (idx < 0) return prev;
      return [...prev.slice(0, idx), updated, ...prev.slice(idx + 1)];
    }, false);

  return (
    <>
      {viewing && (
        <VerificationDialog
          user={viewing}
          onChange={(updated: UserJSON) => {
            setViewing(updated);
            return update(updated);
          }}
          onClosed={() => setViewing(undefined)}
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
            <ChipSet>
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
                  setQuery(new Query({ ...query, tags }));
                }}
                selected={
                  query.tags.findIndex(({ value }) => value === 'not-vetted') >=
                  0
                }
              />
              <Chip
                label={msg(msgs.visible)}
                checkmark
                onInteraction={() =>
                  setQuery(
                    new Query({
                      ...query,
                      visible: query.visible !== true ? true : undefined,
                    })
                  )
                }
                selected={query.visible === true}
              />
              <Chip
                label={msg(msgs.hidden)}
                checkmark
                onInteraction={() =>
                  setQuery(
                    new Query({
                      ...query,
                      visible: query.visible !== false ? false : undefined,
                    })
                  )
                }
                selected={query.visible === false}
              />
            </ChipSet>
          </div>
        </div>
        {(isValidating || !!(users || []).length) && (
          <DataTable className={styles.table}>
            <DataTableContent>
              <DataTableHead className={styles.header}>
                <DataTableRow>
                  <DataTableHeadCell hasFormControl>Visible</DataTableHeadCell>
                  <DataTableHeadCell hasFormControl>Vetted</DataTableHeadCell>
                  <DataTableHeadCell className={styles.sticky}>
                    Name
                  </DataTableHeadCell>
                  <DataTableHeadCell>Bio</DataTableHeadCell>
                  <DataTableHeadCell>Email</DataTableHeadCell>
                  <DataTableHeadCell>Phone</DataTableHeadCell>
                  <DataTableHeadCell>Tutoring Subjects</DataTableHeadCell>
                  <DataTableHeadCell>Mentoring Subjects</DataTableHeadCell>
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {!!users &&
                  !!users.length &&
                  users.map((user: UserJSON) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onChange={update}
                      onClick={() => setViewing(user)}
                      selected={selected.indexOf(user.id) >= 0}
                      setSelected={() => {
                        const idx = selected.indexOf(user.id);
                        if (idx < 0) {
                          setSelected([...selected, user.id]);
                        } else {
                          const copy: string[] = Array.from(selected);
                          copy.splice(idx, 1);
                          setSelected(copy);
                        }
                      }}
                    />
                  ))}
                {(!users || !users.length) &&
                  isValidating &&
                  Array(10)
                    .fill(null)
                    .map(() => <LoadingRow key={uuid()} />)}
              </DataTableBody>
            </DataTableContent>
          </DataTable>
        )}
        {!isValidating && !(users || []).length && (
          <div className={styles.empty}>
            <Placeholder>NO PEOPLE TO SHOW</Placeholder>
          </div>
        )}
      </div>
    </>
  );
}
