import useSWR from 'swr';
import { useState } from 'react';

import DialogContent from 'components/dialog';
import UserDialogContent from 'components/user-dialog/content';

import {
  Callback,
  Match,
  MatchJSON,
  RequestJSON,
  User,
  UserJSON,
} from 'lib/model';

import DisplayPage from './display-page';

export enum Page {
  Display = 0,
  User,
}

export interface MatchDialogContentProps {
  initialData?: MatchJSON;
}

export default function MatchDialogContent({
  initialData = new Match().toJSON(),
}: MatchDialogContentProps): JSX.Element {
  const { data } = useSWR<MatchJSON>(`/api/matches/${initialData.id}`, {
    initialData,
    revalidateOnMount: true,
  });
  const match = data as MatchJSON;

  const [active, setActive] = useState<number>(Page.Display);
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  const [user, setUser] = useState<UserJSON>(new User().toJSON());
  const [matching, setMatching] = useState<RequestJSON[]>([]);

  return (
    <DialogContent
      active={active}
      loading={loading}
      checked={checked}
      setActive={setActive}
      nestedPages={[1]}
    >
      <DisplayPage match={match} setActive={setActive} setUser={setUser} />
      <UserDialogContent
        initialData={user}
        matching={matching}
        setMatching={setMatching}
      />
    </DialogContent>
  );
}
