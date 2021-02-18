import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';

import DialogContent from 'components/dialog';

import { Meeting, User, UserJSON } from 'lib/model';

import DisplayPage from './display-page';
import EditPage from './edit-page';

export enum Page {
  Display = 0,
  Edit,
}

export interface EditDialogProps {
  meeting: Meeting;
}

export default function EditDialog({ meeting }: EditDialogProps): JSX.Element {
  const [active, setActive] = useState<number>(Page.Display);
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  const openEdit = useCallback(() => setActive(Page.Edit), []);

  const { data } = useSWR<UserJSON[]>(
    `/api/matches/${meeting.match.id}/people`
  );
  const people = useMemo(() => {
    if (data) return data.map((u) => User.fromJSON(u));
    return meeting.match.people.map((p) => new User(p));
  }, [data, meeting.match.people]);

  return (
    <DialogContent
      active={active}
      setActive={setActive}
      loading={loading}
      checked={checked}
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
        setLoading={setLoading}
        setChecked={setChecked}
      />
    </DialogContent>
  );
}
