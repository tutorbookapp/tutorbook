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
import meeting from 'locales/en/meeting.json';

function CalendarPage(): JSX.Element {
  usePage({ name: 'Calendar', url: '/calendar', login: true });

  const [searching, setSearching] = useState<boolean>(true);
  const [query, setQuery] = useState<MeetingsQuery>(
    new MeetingsQuery({ hitsPerPage: 1000 })
  );

  const onQueryChange = useCallback((param: CallbackParam<MeetingsQuery>) => {
    setQuery((prev) => {
      let updated = prev;
      if (typeof param === 'object') updated = param;
      if (typeof param === 'function') updated = param(updated);
      if (dequal(updated, prev)) return prev;
      setSearching(true);
      return updated;
    });
  }, []);

  const { t, lang: locale } = useTranslation();
  const { user, loggedIn } = useUser();

  useEffect(() => {
    onQueryChange((prev) => {
      if (!loggedIn) return prev;
      const people = [{ label: user.name, value: user.id }];
      return new MeetingsQuery({ ...prev, people });
    });
  }, [loggedIn, user, onQueryChange]);

  const [mutatedIds, setMutatedIds] = useState<Set<string>>(new Set());
  const { data, isValidating } = useSWR<ListMeetingsRes>(
    loggedIn ? query.endpoint : null,
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

  const title = useMemo(() => {
    const { from, to } = query;
    if (from.getMonth() !== to.getMonth())
      return `${from.toLocaleString(locale, {
        month: 'short',
        year: from.getFullYear() !== to.getFullYear() ? 'numeric' : undefined,
      })} - ${to.toLocaleString(locale, {
        month: 'short',
        year: 'numeric',
      })}`;
    return from.toLocaleString(locale, { month: 'long', year: 'numeric' });
  }, [query, locale]);

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
        header={title}
        body='Create, edit, and cancel your meetings'
        actions={[
          {
            label: 'Previous week',
            onClick: () =>
              onQueryChange((prev) => {
                const to = new Date(prev.from);
                const from = new Date(
                  to.getFullYear(),
                  to.getMonth(),
                  to.getDate() - 7
                );
                return new MeetingsQuery({ ...prev, from, to });
              }),
          },
          {
            label: 'Next week',
            onClick: () =>
              onQueryChange((prev) => {
                const from = new Date(prev.to);
                const to = new Date(
                  from.getFullYear(),
                  from.getMonth(),
                  from.getDate() + 7
                );
                return new MeetingsQuery({ ...prev, from, to });
              }),
          },
          {
            label: 'Today',
            onClick: () =>
              onQueryChange((prev) => {
                const { from, to } = new MeetingsQuery();
                return new MeetingsQuery({ ...prev, from, to });
              }),
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

export default withI18n(CalendarPage, { common, match, meeting });
