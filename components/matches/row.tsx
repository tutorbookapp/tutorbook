import { DataTableCell, DataTableRow } from '@rmwc/data-table';
import { memo } from 'react';
import equal from 'fast-deep-equal';

import { MatchJSON, Person } from 'lib/model';
import Utils from 'lib/utils';

import styles from './matches.module.scss';

interface MatchRowProps {
  match: MatchJSON;
}

export const MatchRow = memo(
  function MatchRow({ match }: MatchRowProps) {
    const names: string[] = [];
    match.people.forEach((p: Person) => {
      if (p.name) names.push(`${p.name} (${Utils.join(p.roles) || 'other'})`);
    });
    const diff = match.people.length - names.length;
    if (diff > 0) names.push(`${diff} more`);
    return (
      <DataTableRow data-cy='match-row'>
        <DataTableCell className={styles.people}>
          {Utils.join(names)}
        </DataTableCell>
        <DataTableCell className={styles.subjects}>
          {Utils.join(match.subjects)}
        </DataTableCell>
        <DataTableCell className={styles.message}>
          {match.message}
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
      <DataTableCell className={styles.people} />
      <DataTableCell className={styles.subjects} />
      <DataTableCell className={styles.message} />
    </DataTableRow>
  );
});
