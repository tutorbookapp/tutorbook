import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { dequal } from 'dequal/lite';
import useTranslation from 'next-translate/useTranslation';

import Calendar from 'components/calendar';
import Header from 'components/header';
import Page from 'components/page';
import { TabHeader } from 'components/navigation';

import { CallbackParam, Meeting, MeetingsQuery } from 'lib/model';
import { ListMeetingsRes } from 'lib/api/routes/meetings/list';
import { usePage } from 'lib/hooks';
import { useUser } from 'lib/context/user';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import match from 'locales/en/match.json';

function CalendarPage(): JSX.Element {
  usePage({ name: 'Calendar', url: '/calendar', login: true });

  const [searching, setSearching] = useState<boolean>(true);
  const [query, setQuery] = useState<MeetingsQuery>();

  const onQueryChange = useCallback(
    (param: CallbackParam<MeetingsQuery | undefined>) => {
      setQuery((prev) => {
        let updated = prev;
        if (typeof param === 'object') updated = param;
        if (typeof param === 'function') updated = param(updated);
        if (dequal(updated, prev)) return prev;
        setSearching(true);
        return updated;
      });
    },
    []
  );

  const { t } = useTranslation();
  const { user } = useUser();

  useEffect(() => {
    onQueryChange((prev) => {
      if (!user.id) return;
      const people = [{ label: user.name, value: user.id }];
      return new MeetingsQuery({ ...prev, people });
    });
  }, [user, onQueryChange]);

  const [mutatedIds, setMutatedIds] = useState<Set<string>>(new Set());
  const { data, isValidating } = useSWR<ListMeetingsRes>(
    query ? query.endpoint : null,
    {
      revalidateOnFocus: !mutatedIds.size,
      revalidateOnReconnect: !mutatedIds.size,
    }
  );

  const meetings = useMemo(
    () => data?.meetings.map((m) => Meeting.fromJSON(m)) || [],
    [data?.meetings]
  );
  const setMeetings = useCallback(
    async (param: CallbackParam<Meeting[]>) => {
      let updated = meetings;
      if (typeof param === 'object') updated = param;
      if (typeof param === 'function') updated = param(updated);
      if (!query?.endpoint || dequal(updated, meetings)) return;
      // TODO: If we ever need to use the `hits` property, we'll have to update
      // this callback function to properly cache and reuse the previous value.
      await mutate(
        query?.endpoint,
        { meetings: updated.map((m) => m.toJSON()) },
        false
      );
    },
    [meetings, query?.endpoint]
  );

  useEffect(() => {
    setSearching((prev) => prev && (isValidating || !data));
  }, [isValidating, data]);

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
      <Header
        header={t('common:calendar')}
        body='Create, edit, and cancel meetings'
        actions={[
          {
            label: 'Previous week',
            href: '#',
          },
          {
            label: 'Next week',
            href: '#',
          },
          {
            label: 'Today',
            href: '#',
          },
        ]}
      />
      <Calendar
        query={query}
        searching={searching}
        meetings={meetings}
        setMeetings={setMeetings}
        setMutatedIds={setMutatedIds}
      />
    </Page>
  );
}

export default withI18n(CalendarPage, { common, match });
