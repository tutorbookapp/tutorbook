import { memo, useCallback, useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { dequal } from 'dequal/lite';

import DialogContent from 'components/dialog';
import UserDialogContent from 'components/user-dialog/content';

import { Match, MatchJSON, RequestJSON, User } from 'lib/model';
import clone from 'lib/utils/clone';

import DisplayPage from './display-page';
import EditPage from './edit-page';
import LogMeetingPage from './log-meeting-page';

export interface MatchDialogContentProps {
  initialData?: MatchJSON;
}

export default memo(
  function MatchDialogContent({
    initialData = new Match().toJSON(),
  }: MatchDialogContentProps): JSX.Element {
    const { data } = useSWR<MatchJSON>(`/api/matches/${initialData.id}`, {
      initialData,
      revalidateOnMount: true,
    });
    const match = data as MatchJSON;

    const [active, setActive] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [checked, setChecked] = useState<boolean>(false);

    const [matching, setMatching] = useState<RequestJSON[]>([]);

    const people = useMemo(() => {
      const ppl = clone(match.people);
      const creatorId = match.creator.id;
      if (ppl.findIndex((p) => p.id === creatorId) < 0) ppl.push(match.creator);
      return ppl;
    }, [match.people, match.creator]);

    const onChange = useCallback(async (updated: MatchJSON) => {
      await mutate(`/api/matches/${updated.id}`, updated, false);
    }, []);

    const content = useMemo(
      () =>
        [
          <DisplayPage match={match} people={people} setActive={setActive} />,
          <EditPage
            match={match}
            onChange={onChange}
            setLoading={setLoading}
            setChecked={setChecked}
            setActive={setActive}
          />,
          <LogMeetingPage
            match={match}
            onChange={onChange}
            setLoading={setLoading}
            setChecked={setChecked}
            setActive={setActive}
          />,
          people.map((person) => (
            <UserDialogContent
              initialData={new User(person).toJSON()}
              matching={matching}
              setMatching={setMatching}
            />
          )),
        ].flat(),
      [match, matching, people, onChange]
    );

    return (
      <DialogContent
        active={active}
        loading={loading}
        checked={checked}
        setActive={setActive}
        nestedPages={people.map((_, idx) => idx + 3)}
      >
        {content}
      </DialogContent>
    );
  },
  (prevProps: MatchDialogContentProps, nextProps: MatchDialogContentProps) => {
    return dequal(prevProps, nextProps);
  }
);
