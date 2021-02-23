import { useCallback, useState } from 'react';

import DialogContent from 'components/dialog';

import { Meeting } from 'lib/model';
import { usePeople } from 'lib/hooks';

import DisplayPage from './display-page';
import EditPage from './edit-page';

export enum Page {
  Display = 0,
  Edit,
}

export interface EditDialogProps {
  meeting: Meeting;
  dialogOpen: boolean;
}

export default function EditDialog({
  meeting,
  dialogOpen,
}: EditDialogProps): JSX.Element {
  const [active, setActive] = useState<number>(Page.Display);
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  const openEdit = useCallback(() => setActive(Page.Edit), []);
  const people = usePeople(meeting.match);

  return (
    <DialogContent
      active={active}
      setActive={setActive}
      loading={loading}
      checked={checked}
      link={`/${meeting.match.org}/matches/${meeting.match.id}`}
    >
      <DisplayPage
        people={people}
        meeting={meeting}
        openEdit={openEdit}
        setLoading={setLoading}
        setChecked={setChecked}
      />
      <EditPage
        people={people}
        meeting={meeting}
        dialogOpen={dialogOpen}
        setLoading={setLoading}
        setChecked={setChecked}
      />
    </DialogContent>
  );
}
