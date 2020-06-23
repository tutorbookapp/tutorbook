import { DataTableRow, DataTableCell } from '@rmwc/data-table';
import { TextField } from '@rmwc/textfield';
import { Select } from '@rmwc/select';
import { Checkbox } from '@rmwc/checkbox';
import { User, UserJSON, ApiError } from '@tutorbook/model';

import React from 'react';
import Utils from '@tutorbook/utils';

import to from 'await-to-js';
import useSWR, { mutate } from 'swr';
import axios, { AxiosResponse, AxiosError } from 'axios';
import styles from './people.module.scss';

async function updateUserData(user: User): Promise<void> {
  const [err, res] = await to<AxiosResponse<UserJSON>, AxiosError<ApiError>>(
    axios.put<UserJSON>(`/api/users/${user.id}`, user.toJSON())
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
    const { data } = res as AxiosResponse<UserJSON>;
    await mutate(`/api/users/${user.id}`, data, false);
  }
}

interface RowProps {
  user: User;
  selected: boolean;
  setSelected: (event: React.FormEvent<HTMLInputElement>) => void;
  onBlur: (event: React.FormEvent<HTMLInputElement>) => void;
  onChange: (event: React.FormEvent<HTMLInputElement>, field: string) => void;
}

function Row({
  user,
  selected,
  setSelected,
  onBlur,
  onChange,
}: RowProps): JSX.Element {
  return (
    <DataTableRow selected={selected}>
      <DataTableCell hasFormControl>
        <Checkbox checked={selected} onChange={setSelected} />
      </DataTableCell>
      <DataTableCell className={styles.sticky}>
        <TextField
          value={user.name}
          onBlur={onBlur}
          className={styles.field}
          onChange={(evt) => onChange(evt, 'name')}
        />
      </DataTableCell>
      <DataTableCell>
        <TextField
          value={user.bio}
          onBlur={onBlur}
          className={`${styles.field} ${styles.bio}`}
          onChange={(evt) => onChange(evt, 'bio')}
        />
      </DataTableCell>
      <DataTableCell>
        <TextField
          value={user.email}
          onBlur={onBlur}
          className={`${styles.field} ${styles.email}`}
          onChange={(evt) => onChange(evt, 'email')}
          type='email'
        />
      </DataTableCell>
      <DataTableCell>
        <TextField
          value={user.phone ? user.phone : undefined}
          onBlur={onBlur}
          className={styles.field}
          onChange={(evt) => onChange(evt, 'phone')}
          type='tel'
        />
      </DataTableCell>
      <DataTableCell>{Utils.join(user.tutoring.subjects)}</DataTableCell>
      <DataTableCell>{Utils.join(user.mentoring.subjects)}</DataTableCell>
      <DataTableCell>
        <Select
          className={styles.select}
          placeholder='--Select--'
          options={['Tutoring', 'Mentoring']}
        />
      </DataTableCell>
    </DataTableRow>
  );
}

export function LoadingRow(): JSX.Element {
  const [user, setUser] = React.useState<User>(new User());
  const [selected, setSelected] = React.useState<boolean>(false);

  return (
    <Row
      user={user}
      selected={selected}
      setSelected={() => setSelected(!selected)}
      onBlur={() => {}}
      onChange={(event: React.FormEvent<HTMLInputElement>, field: string) => {
        setUser(new User({ ...user, [field]: event.currentTarget.value }));
      }}
    />
  );
}

interface PersonRowProps {
  person: User;
  selected: boolean;
  setSelected: (event: React.FormEvent<HTMLInputElement>) => void;
}

/**
 * The `PeopleRow` accepts an initial state of a user object (fetched via the
 * `api/people` endpoint using the current filters within the data table). It
 * then maintains it's own internal state of the user, calls the `api/user`
 * endpoint whenever a `TextField` is unfocused, and alerts the parent component
 * to update it's data (i.e. perform a locale mutation and re-fetch) once the
 * change is enacted.
 */
export function PersonRow({
  person,
  selected,
  setSelected,
}: PersonRowProps): JSX.Element {
  const { data: user } = useSWR(`/api/users/${person.id}`, {
    initialData: person.toJSON(),
  });

  React.useEffect(() => {
    void mutate(`/api/users/${person.id}`, person.toJSON(), false);
  }, [person]);

  return (
    <Row
      user={user ? User.fromJSON(user) : person}
      selected={selected}
      setSelected={setSelected}
      onBlur={() => updateUserData(user ? User.fromJSON(user) : person)}
      onChange={(event: React.FormEvent<HTMLInputElement>, field: string) => {
        void mutate(
          `/api/users/${(user || person).id}`,
          (prev: UserJSON) => ({
            ...(prev || person),
            [field]: event.currentTarget.value,
          }),
          false
        );
      }}
    />
  );
}
