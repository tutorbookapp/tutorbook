import { v4 as uuid } from 'uuid';
import useSWR from 'swr';
import to from 'await-to-js';
import axios, { AxiosResponse, AxiosError } from 'axios';

import {
  DataTable,
  DataTableContent,
  DataTableHead,
  DataTableHeadCell,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from '@rmwc/data-table';
import { Snackbar } from '@rmwc/snackbar';
import { Checkbox } from '@rmwc/checkbox';
import { TextField } from '@rmwc/textfield';
import { IconButton } from '@rmwc/icon-button';
import { ChipSet, Chip } from '@rmwc/chip';

import { useAccount } from '@tutorbook/firebase';
import { ApiError, User, UserJSON } from '@tutorbook/model';
import { IntercomAPI } from '@tutorbook/react-intercom';

import React from 'react';
import CreateUserDialog from '@tutorbook/create-user-dialog';
import VerificationDialog from '@tutorbook/verification-dialog';
import Title from './title';
import PeopleRow from './people-row';

import styles from './people.module.scss';

async function fetchPeopleData(
  url: string,
  id: string,
  token: string
): Promise<User[]> {
  console.log('[DEBUG] Fetching people data...', [url, id, token]);
  const [err, res] = await to<AxiosResponse<UserJSON[]>, AxiosError<ApiError>>(
    axios.get(url, {
      params: { id },
      headers: { Authorization: `Bearer ${token}` },
    })
  );
  if (err && err.response) {
    console.error(`[ERROR] ${err.response.data.msg}`);
    throw new Error(err.response.data.msg);
  } else if (err && err.request) {
    console.error('[ERROR] Search REST API did not respond:', err.request);
    throw new Error('Search REST API did not respond.');
  } else if (err) {
    console.error('[ERROR] While sending request:', err);
    throw new Error(`While sending request: ${err.message}`);
  } else {
    return (res as AxiosResponse<UserJSON[]>).data.map((user: UserJSON) =>
      User.fromJSON(user)
    );
  }
}

export default function People(): JSX.Element {
  const {
    account: { id, name },
    token,
  } = useAccount();
  const { data } = useSWR(
    () => (id && token ? ['/api/users', id, token] : null),
    fetchPeopleData
  );
  const [users, setUsers] = React.useState<User[]>(data || []);

  React.useEffect(() => setUsers((prev) => data || prev), [data]);

  const [selected, setSelected] = React.useState<string[]>([]);
  const [viewingSnackbar, setViewingSnackbar] = React.useState<boolean>(false);
  const [viewingCreateUserDialog, setViewingCreateUserDialog] = React.useState<
    boolean
  >(false);
  const [viewing, setViewing] = React.useState<User | undefined>();

  return (
    <>
      {viewing && (
        <VerificationDialog
          user={viewing}
          onClosed={() => setViewing(undefined)}
        />
      )}
      {viewingCreateUserDialog && (
        <CreateUserDialog onClosed={() => setViewingCreateUserDialog(false)} />
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
        body={`${name}'s tutors, mentors and students.`}
        actions={[
          {
            label: 'Create user',
            onClick: () => setViewingCreateUserDialog(true),
          },
          {
            label: 'Import data',
            onClick: () =>
              IntercomAPI('showNewMessage', "I'd like to import data."),
          },
          {
            label: 'Share sign-up link',
            onClick: () => setViewingSnackbar(true),
          },
        ]}
      />
      <ul className={styles.results}>
        {!data ||
          (!!users.length && (
            <>
              <div className={styles.filters}>
                <div className={styles.left}>
                  <IconButton
                    className={styles.filtersButton}
                    icon='filter_list'
                  />
                  <ChipSet>
                    <Chip label='Not yet vetted' checkmark selected />
                    <Chip label='New users' checkmark />
                    <Chip label='Mentors only' checkmark selected />
                    <Chip label='Tutors only' checkmark />
                  </ChipSet>
                </div>
                <div className={styles.right}>
                  <TextField
                    outlined
                    placeholder='Search'
                    className={styles.searchField}
                  />
                  <IconButton className={styles.menuButton} icon='more_vert' />
                </div>
              </div>
              <DataTable className={styles.table}>
                <DataTableContent>
                  <DataTableHead>
                    <DataTableRow>
                      <DataTableHeadCell hasFormControl>
                        <Checkbox
                          selected={selected.length === users.length}
                          indeterminate={
                            selected.length > 0 &&
                            selected.length !== users.length
                          }
                          onChange={(
                            event: React.FormEvent<HTMLInputElement>
                          ) => {
                            if (event.currentTarget.checked) {
                              setSelected(users.map((u) => u.id));
                            } else {
                              setSelected([]);
                            }
                          }}
                        />
                      </DataTableHeadCell>
                      <DataTableHeadCell className={styles.sticky}>
                        Name
                      </DataTableHeadCell>
                      <DataTableHeadCell>Bio</DataTableHeadCell>
                      <DataTableHeadCell>Email</DataTableHeadCell>
                      <DataTableHeadCell>Phone</DataTableHeadCell>
                      <DataTableHeadCell>Tutoring Subjects</DataTableHeadCell>
                      <DataTableHeadCell>Mentoring Subjects</DataTableHeadCell>
                      <DataTableHeadCell>Featured</DataTableHeadCell>
                    </DataTableRow>
                  </DataTableHead>
                  <DataTableBody>
                    {!users.length &&
                      Array(5)
                        .fill(null)
                        .map(() => (
                          <DataTableRow key={uuid()}>
                            <DataTableCell hasFormControl>
                              <Checkbox />
                            </DataTableCell>
                            {Array(7)
                              .fill(null)
                              .map(() => (
                                <DataTableCell key={uuid()} />
                              ))}
                          </DataTableRow>
                        ))}
                    {!!users.length &&
                      users.map((person: User) => (
                        <PeopleRow
                          person={person}
                          selected={selected.indexOf(person.id) >= 0}
                          setSelected={(event) => {
                            const idx = selected.indexOf(person.id);
                            if (idx < 0) {
                              setSelected([...selected, person.id]);
                            } else {
                              const copy: string[] = Array.from(selected);
                              copy.splice(idx, 1);
                              setSelected(copy);
                            }
                          }}
                        />
                      ))}
                  </DataTableBody>
                </DataTableContent>
              </DataTable>
            </>
          ))}
        {!!data && !users.length && (
          <div className={styles.empty}>NO PEOPLE TO SHOW</div>
        )}
      </ul>
    </>
  );
}
