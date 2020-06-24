import { v4 as uuid } from 'uuid';
import useSWR from 'swr';

import {
  DataTable,
  DataTableContent,
  DataTableHead,
  DataTableHeadCell,
  DataTableBody,
  DataTableRow,
} from '@rmwc/data-table';
import { Snackbar } from '@rmwc/snackbar';
import { Checkbox } from '@rmwc/checkbox';
import { TextField } from '@rmwc/textfield';
import { IconButton } from '@rmwc/icon-button';
import { ChipSet, Chip } from '@rmwc/chip';

import { Query, Org, User, UserJSON } from '@tutorbook/model';
import { IntercomAPI } from '@tutorbook/react-intercom';

import React from 'react';
import CreateUserDialog from '@tutorbook/create-user-dialog';

import { LoadingRow, PersonRow } from './person-row';

import Title from './title';
import Placeholder from './placeholder';

import styles from './people.module.scss';

interface PeopleProps {
  people: User[];
  org: Org;
}

export default function People({ people, org }: PeopleProps): JSX.Element {
  const query = new Query({ orgs: [{ label: org.name, value: org.id }] });
  const { data, isValidating } = useSWR<UserJSON[]>(query.endpoint);
  const [users, setUsers] = React.useState<User[]>(
    data ? data.map((u: UserJSON) => User.fromJSON(u)) : people
  );
  const [selected, setSelected] = React.useState<string[]>([]);
  const [viewingSnackbar, setViewingSnackbar] = React.useState<boolean>(false);
  const [viewingCreateUserDialog, setViewingCreateUserDialog] = React.useState<
    boolean
  >(false);

  React.useEffect(() => {
    setUsers((prev: User[]) => {
      if (data) return data.map((u: UserJSON) => User.fromJSON(u));
      return prev;
    });
  }, [data]);

  return (
    <>
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
        body={`${org.name}'s tutors, mentors and students`}
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
        {(isValidating || !!users.length) && (
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
                        selected={selected.length >= users.length}
                        indeterminate={
                          selected.length > 0 && selected.length < users.length
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
                    Array(10)
                      .fill(null)
                      .map(() => <LoadingRow key={uuid()} />)}
                  {!!users.length &&
                    users.map((person: User) => (
                      <PersonRow
                        key={person.id}
                        person={person}
                        selected={selected.indexOf(person.id) >= 0}
                        setSelected={() => {
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
        )}
        {!isValidating && !users.length && (
          <Placeholder>NO PEOPLE TO SHOW</Placeholder>
        )}
      </ul>
    </>
  );
}
