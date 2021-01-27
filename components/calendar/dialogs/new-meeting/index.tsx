import { useState } from 'react';

import DialogContent from 'components/dialog';

import { Meeting, TCallback } from 'lib/model';

import CreatePage from './create-page';

export enum Page {
  Create = 0,
}

export interface NewMeetingDialogProps {
  viewing: Meeting;
  setViewing: TCallback<Meeting>;
}

export default function NewMeetingDialog({
  viewing,
  setViewing,
}: NewMeetingDialogProps): JSX.Element {
  const [active, setActive] = useState<number>(Page.Create);
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  return (
    <DialogContent
      active={active}
      setActive={setActive}
      loading={loading}
      checked={checked}
    >
      <CreatePage
        people={[]}
        viewing={viewing}
        setViewing={setViewing}
        setLoading={setLoading}
        setChecked={setChecked}
      />
      <></>
    </DialogContent>
  );
}
