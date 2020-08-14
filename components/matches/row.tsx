import { DataTableCell, DataTableRow } from '@rmwc/data-table';
import React, { memo, useCallback } from 'react';
import { TextField } from '@rmwc/textfield';
import equal from 'fast-deep-equal';
import { v4 as uuid } from 'uuid';

import UserSelect from 'components/user-select';
import SubjectSelect from 'components/subject-select';

import { MatchJSON, Person, Role, TCallback } from 'lib/model';

import styles from './matches.module.scss';

interface MatchRowProps {
  match: MatchJSON;
  onChange: TCallback<MatchJSON>;
}

function hasRole(person: Person, role: Role) {
  return person.roles.some((r: Role) => r === role);
}

export const MatchRow = memo(
  function MatchRow({ match, onChange }: MatchRowProps) {
    const onValueChange = useCallback(
      (val: unknown, key: keyof MatchJSON) => {
        if (!equal(val, match[key])) onChange({ ...match, [key]: val });
      },
      [match, onChange]
    );
    const shared = { singleLine: true, renderToPortal: true };
    const props = (role: Role) => ({
      ...shared,
      onChange(ids: string[]) {
        const old: Person[] = match.people.filter((a) => !hasRole(a, role));
        const updated: Person[] = ids.map((id: string) => {
          let handle: string = uuid();
          const idx = match.people.findIndex(({ id: oldId }) => oldId === id);
          if (idx >= 0) handle = match.people[idx].handle;
          return { handle, id, roles: [role] };
        });
        onValueChange([...old, ...updated], 'people');
      },
      value: match.people.filter((a) => hasRole(a, role)).map((a) => a.id),
    });
    // TODO: Fetch all of the person data and use it to directly control the
    // selected options on the `UserSelect` and to constrain the selectable
    // options in the `SubjectSelect` (to only those that the tutors can tutor).
    return (
      <DataTableRow>
        <DataTableCell className={styles.message}>
          <TextField value={match.message} onChange={() => {}} />
        </DataTableCell>
        <DataTableCell className={styles.subjects}>
          <SubjectSelect
            {...shared}
            value={match.subjects}
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
  (prevProps: MatchRowProps, nextProps: MatchRowProps) => {
    return equal(prevProps.match, nextProps.match);
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
