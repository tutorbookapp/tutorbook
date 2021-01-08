import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { dequal } from 'dequal/lite';
import useTranslation from 'next-translate/useTranslation';

import CalendarBody from 'components/calendar';
import { CalendarContext } from 'components/calendar/context';
import CalendarHeader from 'components/calendar/header';
import Page from 'components/page';
import { TabHeader } from 'components/navigation';

import { Meeting, MeetingsQuery } from 'lib/model';
import { ListMeetingsRes } from 'lib/api/routes/meetings/list';
import { usePage } from 'lib/hooks';
import { useUser } from 'lib/context/user';
import { withI18n } from 'lib/intl';

import calendar from 'locales/en/calendar.json';
import common from 'locales/en/common.json';
import match from 'locales/en/match.json';
import meeting from 'locales/en/meeting.json';

function CalendarPage(): JSX.Element {
  usePage({ name: 'Calendar', url: '/calendar', login: true });

  const [mutatedIds, setMutatedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState<MeetingsQuery>(
    new MeetingsQuery({ hitsPerPage: 1000 })
  );

  useEffect(() => console.log('Mutated:', mutatedIds), [mutatedIds]);

  const { t } = useTranslation();
  const { user, loggedIn } = useUser();
  const { data } = useSWR<ListMeetingsRes>(
    query.people.length ? query.endpoint : null,
    {
      revalidateOnFocus: !mutatedIds.size,
      revalidateOnReconnect: !mutatedIds.size,
    }
  );

  useEffect(() => {
    setQuery((prev) => {
      if (!loggedIn) return prev;
      const people = [{ label: user.name, value: user.id }];
      if (dequal(people, prev.people)) return prev;
      return new MeetingsQuery({ ...prev, people });
    });
  }, [loggedIn, user]);

  const meetings = useMemo(
    () => data?.meetings.map((m) => Meeting.fromJSON(m)) || [],
    [data?.meetings]
  );

  const startingDate = useMemo(() => query.from, [query.from]);
  const mutateMeeting = useCallback(
    async (mutated: Meeting, hasBeenUpdated = false) => {
      console.log(`Mutating (${hasBeenUpdated}) meeting (${mutated.id})...`);
      setMutatedIds((prev) => {
        const mutatedMeetingIds = new Set(prev);
        if (!hasBeenUpdated) mutatedMeetingIds.add(mutated.id);
        if (hasBeenUpdated) mutatedMeetingIds.delete(mutated.id);
        if (dequal([...mutatedMeetingIds], [...prev])) return prev;
        return mutatedMeetingIds;
      });
      const idx = meetings.findIndex((m) => m.id === mutated.id);
      const updated =
        idx < 0
          ? [...meetings, mutated]
          : [...meetings.slice(0, idx), mutated, ...meetings.slice(idx + 1)];
      if (dequal(updated, meetings)) return;
      // Note: If we ever need to use the `hits` property, we'll have to update
      // this callback function to properly cache and reuse the previous value.
      const json = updated.map((m) => m.toJSON());
      await mutate(query.endpoint, { meetings: json }, false);
    },
    [query.endpoint, meetings]
  );

  return (
    <Page title='Calendar - Tutorbook'>
      <TabHeader
        switcher
        tabs={[
          {
            label: t('common:overview'),
            href: '/dashboard',
          },
          {
            label: t('common:calendar'),
            href: '/calendar',
            active: true,
          },
          {
            label: t('common:profile'),
            href: '/profile',
          },
        ]}
      />
      <CalendarContext.Provider value={{ startingDate, mutateMeeting }}>
        <CalendarHeader query={query} setQuery={setQuery} />
        <CalendarBody searching={!data} meetings={meetings} />
      </CalendarContext.Provider>
    </Page>
  );
}

export default withI18n(CalendarPage, { calendar, common, match, meeting });
