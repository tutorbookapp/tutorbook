import { useCallback, useEffect, useState } from 'react';
import { dequal } from 'dequal/lite';
import useSWR from 'swr';
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

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const { data, isValidating } = useSWR<ListMeetingsRes>(
    query ? query.endpoint : null
  );

  useEffect(() => {
    setSearching((prev) => prev && (isValidating || !data));
  }, [isValidating, data]);
  useEffect(() => {
    setMeetings(
      (prev) => data?.meetings.map((m) => Meeting.fromJSON(m)) || prev
    );
  }, [data?.meetings]);

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
      />
    </Page>
  );
}

export default withI18n(CalendarPage, { common, match });
