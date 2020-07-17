import { DataTableRow, DataTableCell } from '@rmwc/data-table';
import { TextField } from '@rmwc/textfield';
import { Checkbox } from '@rmwc/checkbox';
import { Aspect, Callback, User, UserJSON } from 'lib/model';

import React from 'react';
import SubjectSelect from 'components/subject-select';

import equal from 'fast-deep-equal';
import styles from './people.module.scss';

interface RowProps {
  user: User;
  onClick: () => void;
  onChange: (event: React.FormEvent<HTMLInputElement>, field: string) => void;
  onSubjectsChange: (subjects: string[], aspect: Aspect) => void;
  emailEditable?: boolean;
}

const Row = function Row({
  user,
  onClick,
  onChange,
  onSubjectsChange,
  emailEditable,
}: RowProps): JSX.Element {
  return (
    <DataTableRow>
      <DataTableCell hasFormControl className={styles.visible}>
        <Checkbox
          checked={user.visible}
          onChange={(evt) => onChange(evt, 'visible')}
        />
      </DataTableCell>
      <DataTableCell hasFormControl className={styles.vetted}>
        <Checkbox checked={!!user.verifications.length} onClick={onClick} />
      </DataTableCell>
      <DataTableCell className={styles.name}>
        <TextField
          value={user.name}
          onChange={(evt) => onChange(evt, 'name')}
        />
      </DataTableCell>
      <DataTableCell className={styles.bio}>
        <TextField value={user.bio} onChange={(evt) => onChange(evt, 'bio')} />
      </DataTableCell>
      <DataTableCell className={styles.email}>
        {emailEditable && (
          <TextField
            value={user.email}
            onChange={(evt) => onChange(evt, 'email')}
            type='email'
          />
        )}
        {!emailEditable && user.email}
      </DataTableCell>
      <DataTableCell className={styles.phone}>
        <TextField
          value={user.phone ? user.phone : undefined}
          onChange={(evt) => onChange(evt, 'phone')}
          type='tel'
        />
      </DataTableCell>
      <DataTableCell className={styles.subjects}>
        <SubjectSelect
          aspect='tutoring'
          value={user.tutoring.subjects}
          onChange={(s: string[]) => onSubjectsChange(s, 'tutoring')}
          renderToPortal
          singleLine
        />
      </DataTableCell>
      <DataTableCell className={styles.subjects}>
        <SubjectSelect
          aspect='mentoring'
          value={user.mentoring.subjects}
          onChange={(s: string[]) => onSubjectsChange(s, 'mentoring')}
          renderToPortal
          singleLine
        />
      </DataTableCell>
    </DataTableRow>
  );
};

export const LoadingRow = React.memo(function LoadingRow(): JSX.Element {
  return (
    <DataTableRow>
      <DataTableCell hasFormControl className={styles.visible}>
        <Checkbox />
      </DataTableCell>
      <DataTableCell hasFormControl className={styles.vetted}>
        <Checkbox />
      </DataTableCell>
      <DataTableCell className={styles.name}>
        <TextField />
      </DataTableCell>
      <DataTableCell className={styles.bio} />
      <DataTableCell className={styles.email} />
      <DataTableCell className={styles.phone} />
      <DataTableCell className={styles.subjects} />
      <DataTableCell className={styles.subjects} />
    </DataTableRow>
  );
});

interface UserRowProps {
  user: UserJSON;
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
export const UserRow = React.memo(
  function UserRow({ user, onClick, onChange }: UserRowProps): JSX.Element {
    const onValueChange = React.useCallback(
      (event: React.FormEvent<HTMLInputElement>, field: string) => {
        const value: string | boolean =
          field === 'visible'
            ? !!event.currentTarget.checked
            : event.currentTarget.value;
        onChange({ ...user, [field]: value });
      },
      [user, onChange]
    );
    const onSubjectsChange = React.useCallback(
      (subjects: string[], aspect: Aspect) => {
        if (equal(subjects, user[aspect].subjects)) return;
        onChange({ ...user, [aspect]: { ...user[aspect], subjects } });
      },
      [user, onChange]
    );

    return (
      <Row
        emailEditable={user.id.startsWith('temp')}
        onClick={onClick}
        user={user ? User.fromJSON(user) : user}
        onChange={onValueChange}
        onSubjectsChange={onSubjectsChange}
      />
    );
  },
  (prevProps: UserRowProps, nextProps: UserRowProps) => {
    return equal(prevProps.user, nextProps.user);
  }
);
