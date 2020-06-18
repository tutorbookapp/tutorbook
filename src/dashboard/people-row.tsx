import { DataTableRow, DataTableCell } from '@rmwc/data-table';
import { TextField } from '@rmwc/textfield';
import { Select } from '@rmwc/select';
import { Checkbox } from '@rmwc/checkbox';
import { User, ApiError } from '@tutorbook/model';

import React from 'react';
import Utils from '@tutorbook/utils';

import to from 'await-to-js';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { v4 as uuid } from 'uuid';
import styles from './people.module.scss';

async function updateUserData(user: User): Promise<void> {
  const [err] = await to<AxiosResponse, AxiosError<ApiError>>(
    axios({
      method: 'post',
      url: '/api/user',
      data: { user },
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
  }
}

/**
 * The `PeopleRow` accepts an initial state of a user object (fetched via the
 * `api/people` endpoint using the current filters within the data table). It
 * then maintains it's own internal state of the user, calls the `api/user`
 * endpoint whenever a `TextField` is unfocused, and alerts the parent component
 * to update it's data (i.e. perform a locale mutation and re-fetch) once the
 * change is enacted.
 */
export default function PeopleRow({
  person,
  selected,
  setSelected,
}: {
  person: User;
  selected?: boolean;
  setSelected: (event: React.FormEvent<HTMLInputElement>) => void;
}): JSX.Element {
  const [user, setUser] = React.useState<User>(person);

  React.useEffect(() => setUser(person), [person]);

  const update = (event: React.FormEvent<HTMLInputElement>, field: string) => {
    setUser(new User({ ...user, [field]: event.currentTarget.value }));
  };

  return (
    <DataTableRow key={user.id || uuid()} selected={selected}>
      <DataTableCell hasFormControl>
        <Checkbox checked={selected} onChange={setSelected} />
      </DataTableCell>
      <DataTableCell className={styles.sticky}>
        <TextField
          value={user.name}
          onBlur={() => updateUserData(user)}
          className={styles.field}
          onChange={(evt) => update(evt, 'name')}
        />
      </DataTableCell>
      <DataTableCell>
        <TextField
          value={user.bio}
          onBlur={() => updateUserData(user)}
          className={`${styles.field} ${styles.bio}`}
          onChange={(evt) => update(evt, 'bio')}
        />
      </DataTableCell>
      <DataTableCell>
        <TextField
          value={user.email}
          onBlur={() => updateUserData(user)}
          className={`${styles.field} ${styles.email}`}
          onChange={(evt) => update(evt, 'email')}
        />
      </DataTableCell>
      <DataTableCell>
        <TextField
          value={user.phone ? user.phone : undefined}
          onBlur={() => updateUserData(user)}
          className={styles.field}
          onChange={(evt) => update(evt, 'phone')}
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
