import { DataTableCell, DataTableRow } from '@rmwc/data-table';
import { memo, useMemo } from 'react';
import { dequal } from 'dequal/lite';

import { Callback, MatchJSON, Person } from 'lib/model';
import { join } from 'lib/utils';

import styles from './matches.module.scss';

interface MatchRowProps {
  match: MatchJSON;
  setViewing: Callback<MatchJSON | undefined>;
}

export const MatchRow = memo(
  function MatchRow({ match, setViewing }: MatchRowProps) {
    const peopleNames = useMemo(() => {
      const names: string[] = [];
      match.people.forEach((p: Person) => {
        if (p.name) names.push(`${p.name} (${join(p.roles) || 'other'})`);
      });
      const diff = match.people.length - names.length;
      if (diff > 0) names.push(`${diff} more`);
      return names;
    }, [match.people]);

    return (
      <DataTableRow data-cy='match-row' onClick={() => setViewing(match)}>
        <DataTableCell className={styles.people}>
          {join(peopleNames)}
        </DataTableCell>
        <DataTableCell className={styles.subjects}>
          {join(match.subjects)}
        </DataTableCell>
        <DataTableCell className={styles.message}>
          {match.message}
        </DataTableCell>
      </DataTableRow>
    );
  },
  (prevProps: MatchRowProps, nextProps: MatchRowProps) => {
    return dequal(prevProps.match, nextProps.match);
  }
);

export const LoadingRow = memo(function LoadingRow(): JSX.Element {
  return (
    <DataTableRow className={styles.loading}>
      <DataTableCell className={styles.people} />
      <DataTableCell className={styles.subjects} />
      <DataTableCell className={styles.message} />
    </DataTableRow>
  );
});
