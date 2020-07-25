import { DataTableRow, DataTableCell } from '@rmwc/data-table';
import { TextField } from '@rmwc/textfield';
import { Attendee, Role, Callback, ApptJSON } from 'lib/model';
import { v4 as uuid } from 'uuid';

import React, { useCallback, memo } from 'react';
import UserSelect from 'components/user-select';
import SubjectSelect from 'components/subject-select';

import equal from 'fast-deep-equal';
import styles from './dashboard.module.scss';

interface ApptRowProps {
  appt: ApptJSON;
  onClick: () => void;
  onChange: Callback<ApptJSON>;
}

function hasRole(attendee: Attendee, role: Role) {
  return attendee.roles.some((r: Role) => r === role);
}

export const ApptRow = memo(
  function ApptRow({ appt, onChange }: ApptRowProps) {
    const onValueChange = useCallback(
      (val: unknown, key: keyof ApptJSON) => {
        if (!equal(val, appt[key])) onChange({ ...appt, [key]: val });
      },
      [appt, onChange]
    );
    const shared = { singleLine: true, renderToPortal: true };
    const props = (role: Role) => ({
      ...shared,
      onChange(ids: string[]) {
        const old: Attendee[] = appt.attendees.filter((a) => !hasRole(a, role));
        const updated: Attendee[] = ids.map((id: string) => {
          let handle: string = uuid();
          const idx = appt.attendees.findIndex(({ id: oldId }) => oldId === id);
          if (idx >= 0) handle = appt.attendees[idx].handle;
          return { handle, id, roles: [role] };
        });
        onValueChange([...old, ...updated], 'attendees');
      },
      value: appt.attendees.filter((a) => hasRole(a, role)).map((a) => a.id),
    });
    // TODO: Fetch all of the attendee data and use it to directly control the
    // selected options on the `UserSelect` and to constrain the selectable
    // options in the `SubjectSelect` (to only those that the tutors can tutor).
    return (
      <DataTableRow>
        <DataTableCell className={styles.message}>
          <TextField value={appt.message} onChange={() => {}} />
        </DataTableCell>
        <DataTableCell className={styles.subjects}>
          <SubjectSelect
            {...shared}
            value={appt.subjects}
            onChange={(s: string[]) => onValueChange(s, 'subjects')}
          />
        </DataTableCell>
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
      <DataTableCell className={styles.message} />
      <DataTableCell className={styles.subjects} />
      <DataTableCell className={styles.tutors} />
      <DataTableCell className={styles.tutees} />
      <DataTableCell className={styles.mentors} />
      <DataTableCell className={styles.mentees} />
      <DataTableCell className={styles.parents} />
    </DataTableRow>
  );
});
