import { DataTableCell, DataTableRow } from '@rmwc/data-table';
import { memo, useCallback, useMemo } from 'react';
import axios from 'axios';
import { dequal } from 'dequal/lite';
import { responseInterface } from 'swr/dist/types';

import { Callback, MatchJSON, MatchStatus, Person } from 'lib/model';
import { caps, join } from 'lib/utils';
import { ListMatchesRes } from 'lib/api/routes/matches/list';
import { useContinuous } from 'lib/hooks';

import styles from './matches.module.scss';

interface MatchRowProps {
  match: MatchJSON;
  mutate: responseInterface<ListMatchesRes, Error>['mutate'];
  setDataEdited: Callback<boolean>;
  setViewing: Callback<MatchJSON | undefined>;
}

export const MatchRow = memo(
  function MatchRow({
    match: local,
    mutate,
    setDataEdited,
    setViewing,
  }: MatchRowProps) {
    const updateRemote = useCallback(
      async (updated: MatchJSON) => {
        const { data } = await axios.put<MatchJSON>(
          `/api/matches/${updated.id}`,
          updated
        );
        setDataEdited(false);
        return data;
      },
      [setDataEdited]
    );

    const updateLocal = useCallback(
      async (updated: MatchJSON) => {
        setDataEdited(true);
        await mutate((prev: ListMatchesRes) => {
          if (!prev) return prev;
          const idx = prev.matches.findIndex((m) => m.id === updated.id);
          if (idx < 0) return prev;
          const matches = [
            ...prev.matches.slice(0, idx),
            updated,
            ...prev.matches.slice(idx + 1),
          ];
          return { ...prev, matches };
        }, false);
      },
      [mutate, setDataEdited]
    );

    const { data: match, setData: setMatch } = useContinuous<MatchJSON>(
      local,
      updateRemote,
      updateLocal
    );

    const toggleStatus = useCallback(() => {
      setMatch((prev) => {
        const status = ({
          new: 'active',
          active: 'stale',
          stale: 'new',
        } as Record<MatchStatus, MatchStatus>)[prev.status];
        return { ...prev, status };
      });
    }, [setMatch]);

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
        <DataTableCell className={styles.status}>
          <button
            className={styles[match.status]}
            onClick={toggleStatus}
            type='button'
          >
            {caps(match.status)}
          </button>
        </DataTableCell>
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
    return dequal(prevProps, nextProps);
  }
);

export const LoadingRow = memo(function LoadingRow(): JSX.Element {
  return (
    <DataTableRow>
      <DataTableCell className={styles.status} />
      <DataTableCell className={styles.people} />
      <DataTableCell className={styles.subjects} />
      <DataTableCell className={styles.message} />
    </DataTableRow>
  );
});
