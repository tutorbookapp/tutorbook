import { DataTableRow, DataTableCell } from '@rmwc/data-table';
import { TextField } from '@rmwc/textfield';
import { Checkbox } from '@rmwc/checkbox';
import { Callback, User, UserJSON, ApiError } from 'lib/model';

import React from 'react';
import Utils from 'lib/utils';

import to from 'await-to-js';
import axios, { AxiosResponse, AxiosError } from 'axios';
import styles from './people.module.scss';

interface RowProps {
  user: User;
  index?: number;
  style?: React.CSSProperties;
  onClick: () => void;
  onBlur: (event: React.FormEvent<HTMLInputElement>) => void;
  onChange: (event: React.FormEvent<HTMLInputElement>, field: string) => void;
}

const Row = React.memo(function Row({
  user,
  index,
  style,
  onBlur,
  onClick,
  onChange,
}: RowProps): JSX.Element {
  return (
    <DataTableRow
      style={style}
      tag='div'
      role='row'
      aria-rowindex={index}
      className={styles.row}
    >
      <DataTableCell
        hasFormControl
        tag='div'
        role='cell'
        className={styles.visible}
      >
        <Checkbox
          onBlur={onBlur}
          checked={user.visible}
          onChange={(evt) => onChange(evt, 'visible')}
        />
      </DataTableCell>
      <DataTableCell
        hasFormControl
        tag='div'
        role='cell'
        className={styles.vetted}
      >
        <Checkbox checked={!!user.verifications.length} onClick={onClick} />
      </DataTableCell>
      <DataTableCell tag='div' className={styles.name}>
        <TextField
          value={user.name}
          onBlur={onBlur}
          className={styles.field}
          onChange={(evt) => onChange(evt, 'name')}
        />
      </DataTableCell>
      <DataTableCell tag='div' role='cell' className={styles.bio}>
        <TextField
          value={user.bio}
          onBlur={onBlur}
          className={`${styles.field} ${styles.bio}`}
          onChange={(evt) => onChange(evt, 'bio')}
        />
      </DataTableCell>
      <DataTableCell tag='div' role='cell' className={styles.email}>
        <TextField
          value={user.email}
          onBlur={onBlur}
          className={`${styles.field} ${styles.email}`}
          onChange={(evt) => onChange(evt, 'email')}
          type='email'
        />
      </DataTableCell>
      <DataTableCell tag='div' role='cell' className={styles.phone}>
        <TextField
          value={user.phone ? user.phone : undefined}
          onBlur={onBlur}
          className={styles.field}
          onChange={(evt) => onChange(evt, 'phone')}
          type='tel'
        />
      </DataTableCell>
      <DataTableCell tag='div' role='cell' className={styles.subjects}>
        {Utils.join(user.tutoring.subjects)}
      </DataTableCell>
      <DataTableCell tag='div' role='cell' className={styles.subjects}>
        {Utils.join(user.mentoring.subjects)}
      </DataTableCell>
    </DataTableRow>
  );
});

export const LoadingRow = React.memo(function LoadingRow(): JSX.Element {
  const [user, setUser] = React.useState<User>(new User());

  return (
    <Row
      user={user}
      onClick={() => {}}
      onBlur={() => {}}
      onChange={(event: React.FormEvent<HTMLInputElement>, field: string) => {
        setUser(new User({ ...user, [field]: event.currentTarget.value }));
      }}
    />
  );
});

interface UserRowProps {
  user: UserJSON;
  index?: number;
  style: React.CSSProperties;
  onClick: () => void;
  onChange: Callback<UserJSON>;
}

/**
 * The `PeopleRow` accepts an initial state of a user object (fetched via the
 * `api/people` endpoint using the current filters within the data table). It
 * then maintains it's own internal state of the user, calls the `api/user`
 * endpoint whenever a `TextField` is unfocused, and alerts the parent component
 * to update it's data (i.e. perform a locale mutation and re-fetch) once the
 * change is enacted.
 */
export default React.memo(function UserRow({
  user,
  index,
  style,
  onClick,
  onChange,
}: UserRowProps): JSX.Element {
  return (
    <Row
      style={style}
      index={index}
      onClick={onClick}
      user={user ? User.fromJSON(user) : user}
      onBlur={async () => {
        const [err, res] = await to<
          AxiosResponse<UserJSON>,
          AxiosError<ApiError>
        >(axios.put<UserJSON>(`/api/users/${user.id}`, user));
        if (err && err.response) {
          console.error(`[ERROR] ${err.response.data.msg}`);
          throw new Error(err.response.data.msg);
        } else if (err && err.request) {
          console.error('[ERROR] Users API did not respond:', err.request);
          throw new Error('Users API did not respond.');
        } else if (err) {
          console.error('[ERROR] While updating user:', err);
          throw new Error(`While updating user: ${err.message}`);
        } else {
          const { data: updated } = res as AxiosResponse<UserJSON>;
          return onChange(updated);
        }
      }}
      onChange={(event: React.FormEvent<HTMLInputElement>, field: string) => {
        const value: string | boolean =
          field === 'visible'
            ? !!event.currentTarget.checked
            : event.currentTarget.value;
        return onChange({ ...user, [field]: value });
      }}
    />
  );
});
