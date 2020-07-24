import { DataTableRow, DataTableCell } from '@rmwc/data-table';
import { TextField } from '@rmwc/textfield';
import { Attendee, Role, Callback, ApptJSON } from 'lib/model';

import React, { useCallback, memo } from 'react';
import UserSelect from 'components/user-select';
import SubjectSelect from 'components/subject-select';

import equal from 'fast-deep-equal';
import styles from './people.module.scss';

interface ApptRowProps {
  appt: ApptJSON;
  onClick: () => void;
  onChange: Callback<ApptJSON>;
}

function hasRole(attendee: Attendee, role: Role) {
  return attendee.roles.some((r: Role) => r === role);
}

/**
 * The `PeopleRow` accepts an initial state of a user object (fetched via the
 * `api/people` endpoint using the current filters within the data table). It
 * then maintains it's own internal state of the user, calls the `api/user`
 * endpoint whenever a `TextField` is unfocused, and alerts the parent component
 * to update it's data (i.e. perform a locale mutation and re-fetch) once the
 * change is enacted.
 */
export const ApptRow = memo(
  function ApptRow({ appt, onChange }: ApptRowProps) {
    const onValueChange = useCallback(
      (val: unknown, key: keyof ApptJSON) => {
        if (equal(val, appt[key])) return;
        onChange({ ...appt, [key]: val });
      },
      [appt, onChange]
    );
    const shared = { singleLine: true, renderToPortal: true };
    const props = (role: Role) => ({
      ...shared,
      onChange(a: string[]) {},
      value: appt.attendees.filter((a) => hasRole(a, role)).map((a) => a.id),
    });
    return (
      <DataTableRow>
        <DataTableCell className={styles.tutors}>
          <UserSelect {...props('tutor')} />
        </DataTableCell>
        <DataTableCell className={styles.tutees}>
          <UserSelect {...props('tutee')} />
        </DataTableCell>
        <DataTableCell className={styles.mentors}>
          <UserSelect {...props('mentor')} />
        </DataTableCell>
        <DataTableCell className={styles.mentees}>
          <UserSelect {...props('mentee')} />
        </DataTableCell>
        <DataTableCell className={styles.parents}>
          <UserSelect {...props('parent')} />
        </DataTableCell>
        <DataTableCell className={styles.subjects}>
          <SubjectSelect
            {...shared}
            aspect='tutoring'
            value={appt.subjects}
            onChange={(s: string[]) => onValueChange(s, 'subjects')}
          />
        </DataTableCell>
        <DataTableCell className={styles.subjects}>
          <TextField value={appt.message} onChange={() => {}} />
        </DataTableCell>
      </DataTableRow>
    );
  },
  (prevProps: ApptRowProps, nextProps: ApptRowProps) => {
    return equal(prevProps.appt, nextProps.appt);
  }
);

export const LoadingRow = memo(function LoadingRow(): JSX.Element {
  return (
    <DataTableRow>
      <DataTableCell className={styles.tutors} />
      <DataTableCell className={styles.tutees} />
      <DataTableCell className={styles.mentors} />
      <DataTableCell className={styles.mentees} />
      <DataTableCell className={styles.parents} />
      <DataTableCell className={styles.subjects} />
      <DataTableCell className={styles.message} />
    </DataTableRow>
  );
});
