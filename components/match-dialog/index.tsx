import useSWR from 'swr';
import { useState } from 'react';

import Dialog from 'components/dialog';

import { Match, MatchJSON } from 'lib/model';

import DisplayPage from './display-page';

export enum Page {
  Display = 0,
}

export interface MatchDialogProps {
  onClosed: () => void;
  initialData?: MatchJSON;
}

export default function MatchDialog({
  onClosed,
  initialData = new Match().toJSON(),
}: MatchDialogProps): JSX.Element {
  const { data } = useSWR<MatchJSON>(`/api/matches/${initialData.id}`, {
    initialData,
    revalidateOnMount: true,
  });
  const match = data as MatchJSON;

  const [active, setActive] = useState<number>(Page.Display);
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  return (
    <Dialog
      active={active}
      loading={loading}
      checked={checked}
      setActive={setActive}
      data-cy='match-dialog'
      onClosed={onClosed}
    >
      <DisplayPage match={match} setActive={setActive} />
      <></>
    </Dialog>
  );
}
