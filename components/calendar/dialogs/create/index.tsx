import { useState } from 'react';

import DialogContent from 'components/dialog';

import { Meeting, TCallback } from 'lib/model';

import CreatePage from './create-page';

export enum Page {
  Create = 0,
}

export interface CreateDialogProps {
  viewing: Meeting;
  setViewing: TCallback<Meeting>;
}

export default function CreateDialog({
  viewing,
  setViewing,
}: CreateDialogProps): JSX.Element {
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
