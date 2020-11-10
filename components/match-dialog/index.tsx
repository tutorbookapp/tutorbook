import { useState } from 'react';

import Dialog from 'components/dialog';

import DisplayPage from './display-page';
import EditPage from './edit-page';

export interface MatchDialogProps {
  onClosed: () => void;
}

export default function MatchDialog({
  onClosed,
}: MatchDialogProps): JSX.Element {
  const [active, setActive] = useState<number>(0);

  return (
    <Dialog
      active={active}
      setActive={setActive}
      data-cy='match-dialog'
      onClosed={onClosed}
    >
      <DisplayPage setActive={setActive} />
      <EditPage />
    </Dialog>
  );
}
